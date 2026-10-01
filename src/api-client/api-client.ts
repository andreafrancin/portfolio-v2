declare const __API_BASE_URL__: string;
const API_BASE_URL: string = __API_BASE_URL__;

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

let refreshPromise: Promise<string | null> | null = null;

export function secondsLeft(token: string | null): number {
  if (!token) return -Infinity;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp - Date.now() / 1000;
  } catch {
    return -Infinity;
  }
}

export async function ensureFreshToken(): Promise<string | null> {
  const token = getToken();
  if (secondsLeft(token) > 60) return token;
  if (secondsLeft(getRefreshToken()) <= 0) return secondsLeft(token) > 0 ? token : null;
  return (await refreshAccessToken()) || (secondsLeft(token) > 0 ? token : null);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE_URL}auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      return data.access as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request(endpoint: string, options: RequestInit = {}, isAuth?: boolean) {
  const token = isAuth ? await ensureFreshToken() : getToken();

  if (!token && isAuth) {
    throw new Error('No auth token.');
  }

  const buildHeaders = (authToken: string | null) => ({
    'Content-Type': 'application/json',
    ...(isAuth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  });

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders(token),
  });

  if (res.status === 401 && isAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: buildHeaders(newToken),
      });

      if (!retryRes.ok) {
        const errorText = await retryRes.text();
        throw new Error(`Error ${retryRes.status}: ${errorText}`);
      }

      if (retryRes.status === 204 || retryRes.headers.get('Content-Length') === '0') {
        return null;
      }

      return retryRes.json();
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

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

export function patch(endpoint: string, body: any, isAuth: boolean, options?: any) {
  return request(
    endpoint,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    },
    isAuth
  );
}

export function del(endpoint: string, isAuth: boolean, options?: any) {
  return request(endpoint, { method: 'DELETE', ...options }, isAuth);
}
