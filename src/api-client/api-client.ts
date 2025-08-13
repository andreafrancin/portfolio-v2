const API_BASE_URL = 'http://localhost:8000/api/';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  if (!token) {
    throw new Error('No auth token.');
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  if (res.status === 204 || res.headers.get('Content-Length') === '0') {
    return null;
  }

  return res.json();
}

export function get(endpoint: string, options?: any) {
  return request(endpoint, { method: 'GET', ...options });
}

export function post(endpoint: string, body: any, options?: any) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
}

export function put(endpoint: string, body: any, options?: any) {
  return request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options,
  });
}

export function del(endpoint: string, options?: any) {
  return request(endpoint, { method: 'DELETE', ...options });
}
