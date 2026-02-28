import { post } from '../../api-client/api-client';

export async function login(username: string, password: string) {
  return post('auth/token/', { username, password }, false);
}
