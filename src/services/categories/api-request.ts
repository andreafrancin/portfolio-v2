import { del, get, patch, post } from '../../api-client/api-client';

export interface ApiCategoryBody {
  name_i18n: Record<string, string>;
  color: string;
}

export const fetchAllCategories = () => get('categories/', false);
export const createCategory = (body: ApiCategoryBody) => post('categories/', body, true);
export const updateCategory = (id: number, body: Partial<ApiCategoryBody>) =>
  patch(`categories/${id}/`, body, true);
export const deleteCategory = (id: number) => del(`categories/${id}/`, true);
export const reorderCategories = (order: number[]) => post('categories/reorder/', { order }, true);
