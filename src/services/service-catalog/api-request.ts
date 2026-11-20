import { del, get, patch, post } from '../../api-client/api-client';

export type I18nText = Partial<Record<'es' | 'ca' | 'en', string>>;

export interface ServiceItem {
  id: number;
  group: number;
  name_i18n: I18nText;
  description_i18n: I18nText;
  order: number;
}

export interface ServiceGroup {
  id: number;
  name_i18n: I18nText;
  order: number;
  services: ServiceItem[];
}

export interface ServiceBody {
  group: number;
  name_i18n: I18nText;
  description_i18n: I18nText;
}

export const fetchServiceGroups = (): Promise<ServiceGroup[]> => get('service-groups/', false);
export const createServiceGroup = (body: { name_i18n: I18nText }) =>
  post('service-groups/', body, true);
export const updateServiceGroup = (id: number, body: { name_i18n: I18nText }) =>
  patch(`service-groups/${id}/`, body, true);
export const deleteServiceGroup = (id: number) => del(`service-groups/${id}/`, true);
export const reorderServiceGroups = (order: number[]) =>
  post('service-groups/reorder/', { order }, true);

export const createService = (body: ServiceBody) => post('services/', body, true);
export const updateService = (id: number, body: Partial<ServiceBody>) =>
  patch(`services/${id}/`, body, true);
export const deleteService = (id: number) => del(`services/${id}/`, true);
export const reorderServices = (order: number[]) => post('services/reorder/', { order }, true);

export function pickText(text: I18nText | undefined, lang: string): string {
  const value = text || {};
  return (value[lang as keyof I18nText] || value.es || value.ca || value.en || '').trim();
}
