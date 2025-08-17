const API_BASE_URL = 'https://back.andreafrancin.com/api/';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

async function request(endpoint: string, options: RequestInit = {}, isAuth?: boolean) {
  const token = getToken();

  if (!token && isAuth) {
    throw new Error('No auth token.');
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(isAuth && { Authorization: `Bearer ${token}` }),
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

export function get(endpoint: string, isAuth: boolean, options?: any) {
  return request(endpoint, { method: 'GET', ...options }, isAuth);
}

export function post(endpoint: string, body: any, isAuth: boolean, options?: any) {
  return request(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    },
    isAuth
  );
}

export function put(endpoint: string, body: any, isAuth: boolean, options?: any) {
  return request(
    endpoint,
    {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    },
    isAuth
  );
}

export function del(endpoint: string, isAuth: boolean, options?: any) {
  return request(endpoint, { method: 'DELETE', ...options }, isAuth);
}
