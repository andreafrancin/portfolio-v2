import { get, post, put } from '../../api-client/api-client';

async function fetchContactFromAPI(): Promise<any> {
  const response = await get('contact/', false);
  return response;
}

async function fetchCreateContactFromAPI(body: any): Promise<any> {
  const response = await post(`contact/`, body, true);
  return response;
}

async function fetchEditContactFromAPI(id: number, body: any): Promise<any> {
  const response = await put(`contact/${id}/`, body, true);
  return response;
}

export { fetchContactFromAPI, fetchCreateContactFromAPI, fetchEditContactFromAPI };
