import axios from 'axios';
import { newId } from '#lib/db';
import { local, readCache, writeCache, clearLocalData } from './offlineStore.js';
import { agregarAPendientes, contarPendientes } from './syncQueue.js';
import { computeLocalSummary } from './localAnalytics.js';
import {
  configureConnectivity,
  isOnline,
  markServerDown,
  markServerUp,
  probeSoon,
} from './connectivity.js';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');
configureConnectivity({ baseUrl: API_BASE_URL });
const AUTH_STORAGE_KEY = 'cafesmart_auth';
const LOGIN_ENDPOINT = '/accounts/login/';
const REGISTER_ENDPOINT = '/accounts/register/';
const REFRESH_ENDPOINT = '/accounts/token/refresh/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Con señal débil en la finca es mejor pasar a modo sin conexión que esperar indefinidamente.
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshInFlight;

function readAuthTokens() {
  const savedTokens = localStorage.getItem(AUTH_STORAGE_KEY);
  return savedTokens ? JSON.parse(savedTokens) : null;
}

function saveAuthTokens(tokens) {
  if (!tokens?.access || !tokens?.refresh) {
    throw new Error('El servidor no devolvió los tokens de autenticación esperados.');
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

function getErrorMessage(data, status) {
  if (typeof data?.detail === 'string') return data.detail;

  const fieldLabels = {
    email: 'Correo electrónico',
    first_name: 'Nombre',
    last_name: 'Apellido',
    location: 'Ubicación',
    name: 'Nombre',
    non_field_errors: 'Datos',
    category: 'Categoría',
    amount: 'Valor',
    buyer: 'Comprador',
    coffee_type: 'Tipo de café',
    sale_date: 'Fecha de venta',
    unit_price: 'Precio por kilogramo',
    password: 'Contraseña',
    phone_number: 'Teléfono',
    description: 'Descripción',
    id_farm: 'Finca',
    coffee_variety: 'Variedad de café',
    area_hectares: 'Área',
    area_m2: 'Área',
    plant_count: 'Número de plantas',
    is_active: 'Estado',
    identification: 'Identificación',
    phone: 'Teléfono',
    is_harvest: 'Actividad de recolección',
    worker: 'Trabajador',
    workday_worker: 'Participación de trabajador',
    farm: 'Finca',
    date: 'Fecha',
    payment_mode: 'Modalidad de pago',
    agreed_rate: 'Tarifa acordada',
    activity_type: 'Actividad',
    workday: 'Jornada',
    lot: 'Lote',
    workday_detail: 'Detalle de jornada',
    quantity_kg: 'Cantidad recolectada',
    time: 'Hora',
  };
  const fieldErrors = Object.entries(data || {})
    .map(([field, messages]) => {
      const values = Array.isArray(messages) ? messages : [messages];
      return `${fieldLabels[field] || field}: ${values.join(' ')}`;
    })
    .join(' ');

  return fieldErrors || `Error ${status}`;
}

function normalizeList(data, resourceName) {
  const items = Array.isArray(data) ? data : data?.results;
  if (!Array.isArray(items)) {
    throw new Error(`El servidor devolvió una lista de ${resourceName} no válida.`);
  }
  return items;
}

function normalizeFarm(farm) {
  return {
    ...farm,
    nombre: farm.name,
    ubicacion: farm.location || '',
  };
}

function normalizeLot(lot) {
  return {
    ...lot,
    fincaId: lot.id_farm,
    nombre: lot.name,
    variedad: lot.coffee_variety || '',
    hectareas: lot.area_hectares ?? lot.area_m2 ?? null,
    estado: lot.is_active ? 'activo' : 'inactivo',
    fechaCreacion: lot.created_at,
    fechaDesactivacion: null,
    fechaReactivacion: null,
  };
}

function normalizeWorker(worker) {
  const firstName = worker.first_name || '';
  const lastName = worker.last_name || '';
  return {
    ...worker,
    nombre: [firstName, lastName].filter(Boolean).join(' '),
    cedula: worker.identification || '',
    estado: worker.is_active ? 'activo' : 'inactivo',
  };
}

function normalizeActivity(activity) {
  return {
    ...activity,
    description: activity.description || '',
    is_harvest: Boolean(activity.is_harvest),
  };
}

function normalizeApiError(error) {
  if (!error.response) {
    return new Error(
      'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.',
      { cause: error },
    );
  }
  return new Error(
    getErrorMessage(error.response.data, error.response.status),
    { cause: error },
  );
}

async function refreshAccessToken() {
  const tokens = readAuthTokens();
  if (!tokens?.refresh) return null;

  try {
    const response = await axios.post(
      `${API_BASE_URL}${REFRESH_ENDPOINT}`,
      { refresh: tokens.refresh },
      { headers: { 'Content-Type': 'application/json' } },
    );
    const refreshedTokens = { ...tokens, ...response.data };
    saveAuthTokens(refreshedTokens);
    return refreshedTokens;
  } catch (error) {
    // Solo se cierra la sesión si el servidor rechazó el token, no por falta de conexión.
    if (error.response) localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const isPublicEndpoint = [
    LOGIN_ENDPOINT,
    REGISTER_ENDPOINT,
    REFRESH_ENDPOINT,
  ].includes(config.url);
  const tokens = isPublicEndpoint ? null : readAuthTokens();

  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    markServerUp();
    return response;
  },
  async (error) => {
    if (error.response) markServerUp();
    else markServerDown();
    const request = error.config;
    const isPublicEndpoint = [
      LOGIN_ENDPOINT,
      REGISTER_ENDPOINT,
      REFRESH_ENDPOINT,
    ].includes(request?.url);

    if (
      error.response?.status === 401 &&
      request &&
      !request._retry &&
      !isPublicEndpoint
    ) {
      request._retry = true;
      refreshInFlight ||= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });

      const tokens = await refreshInFlight;
      if (tokens) {
        request.headers.Authorization = `Bearer ${tokens.access}`;
        return apiClient(request);
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);

export async function apiRequest(endpoint, options = {}) {
  const {
    body,
    data = body,
    headers,
    method = 'GET',
    ...requestOptions
  } = options;

  try {
    const response = await apiClient.request({
      ...requestOptions,
      data,
      headers,
      method,
      url: endpoint,
    });
    return response.data;
  } catch (error) {
    console.error('Error en apiRequest:', error);
    throw error;
  }
}


// ---------------------------------------------------------------------------
// Modo sin conexión
// ---------------------------------------------------------------------------
export function isNetworkError(error) {
  const cause = error?.cause ?? error;
  return Boolean(cause?.isAxiosError && !cause.response);
}

// Tiempo máximo que se espera al servidor antes de mostrar la copia local de una lista.
const CACHE_FIRST_WAIT_MS = 1000;
// Tiempo máximo de una escritura antes de guardarla en la cola (es seguro: el servidor
// descarta duplicados por op_id, así que si sí llegó no se registra dos veces).
const WRITE_TIMEOUT_MS = 6000;

// Lista con caché local:
//  - Sin conexión (o con cambios locales aún sin enviar): responde desde el dispositivo al instante.
//  - Con conexión y copia local: espera al servidor como máximo 1 s; si tarda más, muestra la
//    copia local, termina de actualizarla en segundo plano y revisa si el servidor responde.
//  - Sin copia local: espera al servidor.
async function cachedList(key, fetcher) {
  const [hasPending, cached] = await Promise.all([
    contarPendientes().then((n) => n > 0),
    readCache(key),
  ]);
  if (!isOnline() || hasPending) {
    if (cached) return cached;
    if (!isOnline()) {
      throw new Error(
        'Sin conexión y sin datos guardados en este dispositivo. Conéctate una vez para descargarlos.',
      );
    }
    return fetcher();
  }

  const fresh = fetcher().then(async (data) => {
    await writeCache(key, data);
    return data;
  });
  if (!cached) {
    try {
      return await fresh;
    } catch (error) {
      if (isNetworkError(error)) {
        throw new Error(
          'Sin conexión y sin datos guardados en este dispositivo. Conéctate una vez para descargarlos.',
          { cause: error },
        );
      }
      throw error;
    }
  }
  fresh.catch(() => {}); // si falla en segundo plano se queda la copia local
  let timer;
  const fallback = new Promise((resolve) => {
    timer = setTimeout(() => {
      void probeSoon();
      resolve(cached);
    }, CACHE_FIRST_WAIT_MS);
  });
  try {
    return await Promise.race([fresh, fallback]);
  } catch (error) {
    if (isNetworkError(error)) return cached;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Escritura con soporte offline. Toda escritura es una operación con op_id y el UUID del
// registro generado en el dispositivo:
//  - Con conexión y cola vacía: se envía al servidor de inmediato (POST /sync/push/) y los
//    errores de validación se muestran en el formulario como siempre.
//  - Sin conexión, o si el servidor no responde a tiempo: la MISMA operación se guarda en la cola
//    y se aplica en la caché local para que la página la vea al instante.
async function offlineWrite({ entity, action, id, data = {}, apply }) {
  const op = {
    op_id: newId(),
    entity,
    action,
    object_id: id ?? newId(),
    data,
    client_ts: new Date().toISOString(),
  };
  if (isOnline() && (await contarPendientes()) === 0) {
    try {
      const response = await apiClient.post(
        '/sync/push/',
        { operations: [op] },
        { timeout: WRITE_TIMEOUT_MS },
      );
      const result = response.data?.results?.[0];
      const failed =
        !result ||
        result.status === 'rejected' ||
        (result.status === 'duplicate' && result.original_status === 'rejected');
      if (failed) {
        throw new Error(getErrorMessage(result?.errors, result?.http_status), {
          cause: { response: { data: result?.errors, status: result?.http_status } },
        });
      }
      const saved = result.data && typeof result.data === 'object' ? result.data : null;
      await apply(op.object_id, saved && Object.keys(saved).length ? saved : data, true);
      return saved && Object.keys(saved).length ? saved : { ...data, id: op.object_id };
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
  }
  await agregarAPendientes(op);
  const optimistic = await apply(op.object_id, data, false);
  return { ...(optimistic || {}), id: op.object_id, _pending: true };
}

export const api = {
  sync: {
    push: (payload) => apiRequest('/sync/push/', { method: 'POST', data: payload }),
    pull: () => apiRequest('/sync/pull/', { method: 'GET' }),
  },
  auth: {
    login: async (data) => {
      const response = await apiRequest(LOGIN_ENDPOINT, {
        method: 'POST',
        data,
      });
      saveAuthTokens({ access: response.access, refresh: response.refresh });
      return response;
    },
    registro: (data) =>
      apiRequest(REGISTER_ENDPOINT, {
        method: 'POST',
        data,
      }),
    me: () => apiRequest('/accounts/profile/', { method: 'GET' }),
    hasSession: () => {
      const tokens = readAuthTokens();
      return Boolean(tokens?.access || tokens?.refresh);
    },
    logout: async () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      await clearLocalData();
    },
  },
  farms: {
    list: async () =>
      (
        await cachedList('farms', async () =>
          normalizeList(await apiRequest('/farms/'), 'fincas'),
        )
      ).map(normalizeFarm),
    create: async (data) =>
      normalizeFarm(
        await offlineWrite({
          entity: 'farm',
          action: 'create',
          data,
          apply: (id, item) => local.flat.create('farms', id, item, { lots_count: 0 }),
        }),
      ),
    update: async (id, data) =>
      normalizeFarm(
        await offlineWrite({
          entity: 'farm',
          action: 'update',
          id,
          data,
          apply: (itemId, item) => local.flat.update('farms', itemId, item),
        }),
      ),
  },
  analytics: {
    // Con conexión y sin cambios pendientes: resumen del servidor. Sin conexión (o con
    // registros aún sin enviar, que el servidor no conoce): se calcula en el dispositivo.
    summary: async ({ farmId, period = 'month' } = {}) => {
      const localSummary = () => computeLocalSummary({ farmId, period });
      if (!isOnline() || (await contarPendientes()) > 0) return localSummary();
      try {
        return await apiRequest('/analytics/summary/', {
          params: {
            ...(farmId ? { farm_id: farmId } : {}),
            period,
          },
        });
      } catch (error) {
        if (isNetworkError(error)) return localSummary();
        throw error;
      }
    },
  },
  assistant: {
    ask: (question, history = []) =>
      apiRequest('/assistant/ask/', {
        method: 'POST',
        data: { question, history },
      }),
  },
  finance: {
    expenses: {
      list: () =>
        cachedList('expenses', async () =>
          normalizeList(await apiRequest('/finance/expenses/'), 'egresos'),
        ),
      create: (data) =>
        offlineWrite({
          entity: 'expense',
          action: 'create',
          data,
          apply: (id, item) => local.flat.create('expenses', id, item),
        }),
      update: (id, data) =>
        offlineWrite({
          entity: 'expense',
          action: 'update',
          id,
          data,
          apply: (itemId, item) => local.flat.update('expenses', itemId, item),
        }),
    },
  },
  lots: {
    list: async () =>
      (
        await cachedList('lots', async () =>
          normalizeList(await apiRequest('/farms/lots/'), 'lotes'),
        )
      ).map(normalizeLot),
    create: async (data) =>
      normalizeLot(
        await offlineWrite({
          entity: 'lot',
          action: 'create',
          data,
          apply: async (id, item) => {
            const farm = ((await readCache('farms')) || []).find(
              (current) => String(current.id) === String(item.id_farm),
            );
            return local.flat.create('lots', id, item, {
              is_active: true,
              farm_name: farm?.name || '',
            });
          },
        }),
      ),
    update: async (id, data) =>
      normalizeLot(
        await offlineWrite({
          entity: 'lot',
          action: 'update',
          id,
          data,
          apply: (itemId, item) => local.flat.update('lots', itemId, item),
        }),
      ),
  },
  workers: {
    list: async () =>
      (
        await cachedList('workers', async () =>
          normalizeList(await apiRequest('/labor/workers/'), 'trabajadores'),
        )
      ).map(normalizeWorker),
    create: async (data) =>
      normalizeWorker(
        await offlineWrite({
          entity: 'worker',
          action: 'create',
          data,
          apply: (id, item) => local.flat.create('workers', id, item, { is_active: true }),
        }),
      ),
    update: async (id, data) =>
      normalizeWorker(
        await offlineWrite({
          entity: 'worker',
          action: 'update',
          id,
          data,
          apply: (itemId, item) => local.flat.update('workers', itemId, item),
        }),
      ),
  },
  activities: {
    list: async () =>
      (
        await cachedList('activities', async () =>
          normalizeList(
            await apiRequest('/labor/activity-types/'),
            'tipos de actividad',
          ),
        )
      ).map(normalizeActivity),
    create: async (data) =>
      normalizeActivity(
        await offlineWrite({
          entity: 'activity_type',
          action: 'create',
          data,
          apply: (id, item) =>
            local.flat.create('activities', id, item, { description: '', is_harvest: false }),
        }),
      ),
    update: async (id, data) =>
      normalizeActivity(
        await offlineWrite({
          entity: 'activity_type',
          action: 'update',
          id,
          data,
          apply: (itemId, item) => local.flat.update('activities', itemId, item),
        }),
      ),
    delete: (id) =>
      offlineWrite({
        entity: 'activity_type',
        action: 'delete',
        id,
        apply: (itemId) => local.flat.remove('activities', itemId),
      }),
  },
  production: {
    sales: {
      list: () =>
        cachedList('sales', async () =>
          normalizeList(await apiRequest('/production/sales/'), 'ventas'),
        ),
      create: (data) =>
        offlineWrite({
          entity: 'sale',
          action: 'create',
          data,
          apply: (id, item) =>
            local.flat.create('sales', id, item, {
              is_active: true,
              total_amount: (Number(data.quantity_kg) || 0) * (Number(data.unit_price) || 0),
            }),
        }),
      update: (id, data) =>
        offlineWrite({
          entity: 'sale',
          action: 'update',
          id,
          data,
          apply: (itemId, item) => local.flat.update('sales', itemId, item),
        }),
    },
  },
  workdays: {
    list: () =>
      cachedList('workdays', async () =>
        normalizeList(await apiRequest('/labor/workdays/'), 'jornadas'),
      ),
    create: (data) =>
      offlineWrite({
        entity: 'workday',
        action: 'create',
        data,
        apply: (id, item) => local.workdays.create(id, item),
      }),
    updateLabor: (id, data) =>
      offlineWrite({
        entity: 'workday',
        action: 'update_labor',
        id,
        data,
        apply: (itemId, item, fromServer) =>
          fromServer ? local.workdays.replace(item) : local.workdays.updateLabor(itemId, item),
      }),
    close: (id) =>
      offlineWrite({
        entity: 'workday',
        action: 'close',
        id,
        apply: (itemId) => local.workdays.close(itemId),
      }),
    delete: (id) =>
      offlineWrite({
        entity: 'workday',
        action: 'delete',
        id,
        apply: (itemId) => local.workdays.remove(itemId),
      }),
  },
  workdayWorkers: {
    create: (data) =>
      offlineWrite({
        entity: 'workday_worker',
        action: 'create',
        data,
        apply: (id, item) => local.workdayWorkers.create(id, item),
      }),
    update: (id, data) =>
      offlineWrite({
        entity: 'workday_worker',
        action: 'update',
        id,
        data,
        apply: (itemId, item) => local.workdayWorkers.update(itemId, item),
      }),
    cancel: (id) =>
      offlineWrite({
        entity: 'workday_worker',
        action: 'cancel',
        id,
        apply: (itemId) => local.workdayWorkers.setStatus(itemId, 'anulado'),
      }),
    reactivate: (id) =>
      offlineWrite({
        entity: 'workday_worker',
        action: 'reactivate',
        id,
        apply: (itemId) => local.workdayWorkers.setStatus(itemId, 'pendiente'),
      }),
    delete: (id) =>
      offlineWrite({
        entity: 'workday_worker',
        action: 'delete',
        id,
        apply: (itemId) => local.workdayWorkers.remove(itemId),
      }),
  },
  workdayDetails: {
    create: (data) =>
      offlineWrite({
        entity: 'workday_detail',
        action: 'create',
        data,
        apply: (id, item) => local.workdayDetails.create(id, item),
      }),
    update: (id, data) =>
      offlineWrite({
        entity: 'workday_detail',
        action: 'update',
        id,
        data,
        apply: (itemId, item) => local.workdayDetails.update(itemId, item),
      }),
    delete: (id) =>
      offlineWrite({
        entity: 'workday_detail',
        action: 'delete',
        id,
        apply: (itemId) => local.workdayDetails.remove(itemId),
      }),
  },
  harvestRecords: {
    create: (data) =>
      offlineWrite({
        entity: 'harvest_record',
        action: 'create',
        data,
        apply: (id, item) => local.harvestRecords.create(id, item),
      }),
    update: (id, data) =>
      offlineWrite({
        entity: 'harvest_record',
        action: 'update',
        id,
        data,
        apply: (itemId, item) => local.harvestRecords.update(itemId, item),
      }),
  },
  payroll: {
    // Liquida y paga en una sola operación (en línea o desde la cola offline).
    // `existingSettlementId` se usa para liquidaciones abiertas/liquidadas; si no, el id se
    // genera en el dispositivo y así un reenvío nunca crea una segunda liquidación.
    settleAndPay: ({ existingSettlementId, data, preview }) =>
      offlineWrite({
        entity: 'settlement',
        action: 'settle_and_pay',
        id: existingSettlementId,
        data,
        apply: (id, item, fromServer) =>
          local.payroll.settleAndPay(id, data, fromServer ? item : null, preview),
      }),
    // Historial de pagados: solo con conexión (el snapshot offline trae solo lo pendiente).
    paidHistory: async () => {
      if (!isOnline()) return { items: [], offline: true };
      try {
        const data = await apiRequest('/payroll/settlements/', {
          params: { status: 'pagada' },
        });
        return { items: normalizeList(data, 'liquidaciones pagadas'), offline: false };
      } catch (error) {
        if (isNetworkError(error)) return { items: [], offline: true };
        throw error;
      }
    },
    settlements: {
      list: () =>
        cachedList('settlements', async () =>
          normalizeList(await apiRequest('/payroll/settlements/'), 'liquidaciones'),
        ),
      create: (data) =>
        apiRequest('/payroll/settlements/', { method: 'POST', data }),
      addWorkday: (data) =>
        apiRequest('/payroll/settlements/add-workday/', {
          method: 'POST',
          data,
        }),
      addHarvest: (data) =>
        apiRequest('/payroll/settlements/add-harvest/', {
          method: 'POST',
          data,
        }),
      close: (settlementId) =>
        apiRequest('/payroll/settlements/close/', {
          method: 'POST',
          data: { settlement_id: settlementId },
        }),
      pay: (data) =>
        apiRequest('/payroll/settlements/pay/', { method: 'POST', data }),
    },
    settlementWorkdays: {
      list: () =>
        cachedList('settlement_workdays', async () =>
          normalizeList(await apiRequest('/payroll/settlement-workdays/'), 'detalles de liquidación por jornal'),
        ),
    },
    settlementHarvests: {
      list: () =>
        cachedList('settlement_harvests', async () =>
          normalizeList(await apiRequest('/payroll/settlement-harvests/'), 'detalles de liquidación por kilogramo'),
        ),
    },
    payments: {
      list: () =>
        cachedList('payments', async () =>
          normalizeList(await apiRequest('/payroll/payments/'), 'pagos laborales'),
        ),
    },
  },
};
