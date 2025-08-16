import { get, post, put } from '../../api-client/api-client';

async function fetchAboutFromAPI(): Promise<any> {
  const response = await get('about/', false);
  return response;
}

async function fetchCreateAboutFromAPI(body: any): Promise<any> {
  const response = await post(`about/`, body, true);
  return response;
}

async function fetchEditAboutFromAPI(id: number, body: any): Promise<any> {
  const response = await put(`about/${id}/`, body, true);
  return response;
}

export { fetchAboutFromAPI, fetchCreateAboutFromAPI, fetchEditAboutFromAPI };
