const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}`);
    }

    return data;
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
        body: JSON.stringify(payload),
      }),
    obtenerCambios: () => apiRequest('/api/sync', { method: 'GET' }),
  },
  auth: {
    login: (data) =>
      apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    registro: (data) =>
      apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => apiRequest('/api/auth/me', { method: 'GET' }),
  },
};
