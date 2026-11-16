const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('labora_token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 204) {
    return null;
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = result?.detail || 'Terjadi kesalahan pada sistem.';
    throw new Error(errorMsg);
  }

  return result;
}

export const api = {
  get: (url) => apiRequest(url, 'GET'),
  post: (url, data) => apiRequest(url, 'POST', data),
  put: (url, data) => apiRequest(url, 'PUT', data),
  patch: (url, data) => apiRequest(url, 'PATCH', data),
  delete: (url) => apiRequest(url, 'DELETE'),
};
