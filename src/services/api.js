import axios from 'axios';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');
const AUTH_STORAGE_KEY = 'cafesmart_auth';
const LOGIN_ENDPOINT = '/accounts/login/';
const REGISTER_ENDPOINT = '/accounts/register/';
const REFRESH_ENDPOINT = '/accounts/token/refresh/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
    password: 'Contraseña',
    phone_number: 'Teléfono',
    description: 'Descripción',
    id_farm: 'Finca',
    coffee_variety: 'Variedad de café',
    area_hectares: 'Área',
    area_m2: 'Área',
    is_active: 'Estado',
    identification: 'Identificación',
    phone: 'Teléfono',
    is_harvest: 'Actividad de recolección',
    worker: 'Trabajador',
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
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
  (response) => response,
  async (error) => {
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

export const api = {
  sync: {
    enviarPendientes: (payload) =>
      apiRequest('/api/sync', {
        method: 'POST',
        data: payload,
      }),
    obtenerCambios: () => apiRequest('/api/sync', { method: 'GET' }),
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
    logout: () => localStorage.removeItem(AUTH_STORAGE_KEY),
  },
  farms: {
    list: async () =>
      normalizeList(await apiRequest('/farms/'), 'fincas').map(normalizeFarm),
    create: async (data) =>
      normalizeFarm(
        await apiRequest('/farms/', { method: 'POST', data }),
      ),
    update: async (id, data) =>
      normalizeFarm(
        await apiRequest(`/farms/${id}/`, { method: 'PATCH', data }),
      ),
  },
  lots: {
    list: async () =>
      normalizeList(await apiRequest('/farms/lots/'), 'lotes').map(normalizeLot),
    create: async (data) =>
      normalizeLot(
        await apiRequest('/farms/lots/', { method: 'POST', data }),
      ),
    update: async (id, data) =>
      normalizeLot(
        await apiRequest(`/farms/lots/${id}/`, { method: 'PATCH', data }),
      ),
  },
  workers: {
    list: async () =>
      normalizeList(await apiRequest('/labor/workers/'), 'trabajadores').map(
        normalizeWorker,
      ),
    create: async (data) =>
      normalizeWorker(
        await apiRequest('/labor/workers/', { method: 'POST', data }),
      ),
    update: async (id, data) =>
      normalizeWorker(
        await apiRequest(`/labor/workers/${id}/`, { method: 'PATCH', data }),
      ),
  },
  activities: {
    list: async () =>
      normalizeList(
        await apiRequest('/labor/activity-types/'),
        'tipos de actividad',
      ).map(normalizeActivity),
    create: async (data) =>
      normalizeActivity(
        await apiRequest('/labor/activity-types/', { method: 'POST', data }),
      ),
    update: async (id, data) =>
      normalizeActivity(
        await apiRequest(`/labor/activity-types/${id}/`, {
          method: 'PATCH',
          data,
        }),
      ),
    delete: (id) =>
      apiRequest(`/labor/activity-types/${id}/`, { method: 'DELETE' }),
  },
  workdays: {
    list: async () =>
      normalizeList(await apiRequest('/labor/workdays/'), 'jornadas'),
    create: (data) =>
      apiRequest('/labor/workdays/', { method: 'POST', data }),
    delete: (id) =>
      apiRequest(`/labor/workdays/${id}/`, { method: 'DELETE' }),
  },
  workdayDetails: {
    create: (data) =>
      apiRequest('/labor/workday-details/', { method: 'POST', data }),
    delete: (id) =>
      apiRequest(`/labor/workday-details/${id}/`, { method: 'DELETE' }),
  },
  harvestRecords: {
    create: (data) =>
      apiRequest('/labor/harvest-records/', { method: 'POST', data }),
    update: (id, data) =>
      apiRequest(`/labor/harvest-records/${id}/`, { method: 'PATCH', data }),
  },
};
