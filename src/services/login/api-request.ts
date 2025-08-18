const API_BASE_URL = 'https://localhost:8000/api/';
const PROD_API_BASE_URL = 'https://back.andreafrancin.com/api/';

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}
