import { del, get, patch, post, put } from '../../api-client/api-client';

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

async function fetchPatchProjectFromAPI(id: number, body: any): Promise<any> {
  const response = await patch(`projects/${id}/`, body, true);
  return response;
}

async function bulkProjectCategories(body: {
  ids: number[];
  add: string[];
  remove: string[];
}): Promise<Record<string, string[]>> {
  return post('projects/bulk_categories/', body, true);
}

export {
  bulkProjectCategories,
  fetchProjectsFromNewAPI,
  fetchReorderProjectsFromNewAPI,
  fetchRemoveProjectFromAPI,
  fetchAddProjectFromAPI,
  fetchEditProjectFromAPI,
  fetchPatchProjectFromAPI,
  fetchProjectFromNewAPI,
};
