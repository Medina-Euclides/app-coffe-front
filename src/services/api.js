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
    non_field_errors: 'Datos',
    password: 'Contraseña',
    phone_number: 'Teléfono',
  };
  const fieldErrors = Object.entries(data || {})
    .map(([field, messages]) => {
      const values = Array.isArray(messages) ? messages : [messages];
      return `${fieldLabels[field] || field}: ${values.join(' ')}`;
    })
    .join(' ');

  return fieldErrors || `Error ${status}`;
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
};
