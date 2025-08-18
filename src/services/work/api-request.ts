import { del, get, post, put } from '../../api-client/api-client';

const API_BASE_URL = 'http://localhost:8000/api/';
const PROD_API_BASE_URL = 'https://back.andreafrancin.com/api/';

async function fetchProjectsFromAPI(): Promise<any> {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

async function fetchProjectsFromNewAPI(): Promise<any> {
  const response = await get('projects/', false);
  return response;
}

async function fetchProjectFromNewAPI(id: number): Promise<any> {
  const response = await get(`projects/${id}/`, false);
  return response;
}

async function fetchReorderProjectsFromNewAPI(body: any): Promise<any> {
  const response = await post('projects/reorder/', body, true);
  return response;
}

async function fetchRemoveProjectFromAPI(id: number): Promise<any> {
  const response = await del(`projects/${id}/`, true);
  return response;
}

async function fetchAddProjectFromAPI(body: any): Promise<any> {
  const response = await post(`projects/`, body, true);
  return response;
}

async function fetchEditProjectFromAPI(id: number, body: any): Promise<any> {
  const response = await put(`projects/${id}/`, body, true);
  return response;
}

export {
  fetchProjectsFromAPI,
  fetchProjectsFromNewAPI,
  fetchReorderProjectsFromNewAPI,
  fetchRemoveProjectFromAPI,
  fetchAddProjectFromAPI,
  fetchEditProjectFromAPI,
  fetchProjectFromNewAPI,
};
