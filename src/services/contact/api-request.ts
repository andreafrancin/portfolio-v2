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

export interface ContactMessage {
  name: string;
  email: string;
  service: string;
  message: string;
  consent: true;
  language: string;
  website: string;
}

async function sendContactMessage(body: ContactMessage): Promise<void> {
  await post('contact-messages/', body, false);
}

export {
  fetchContactFromAPI,
  fetchCreateContactFromAPI,
  fetchEditContactFromAPI,
  sendContactMessage,
};

export type AutoReplyField =
  | 'subject_i18n'
  | 'greeting_i18n'
  | 'greeting_anonymous_i18n'
  | 'body_i18n'
  | 'button_i18n'
  | 'signature_i18n';

export type AutoReplyTexts = Record<AutoReplyField, Record<string, string>>;

export interface AutoReplySettings extends AutoReplyTexts {
  enabled: boolean;
  defaults: Record<string, Record<string, string>>;
}

export const fetchAutoReply = (): Promise<AutoReplySettings> => get('auto-reply/', true);
export const saveAutoReply = (body: Partial<AutoReplyTexts> & { enabled?: boolean }) =>
  put('auto-reply/', body, true) as Promise<AutoReplySettings>;
export const previewAutoReply = (
  body: AutoReplyTexts & { language: string }
): Promise<{ subject: string; html: string }> => post('auto-reply/preview/', body, true);
export const sendAutoReplyTest = (body: AutoReplyTexts & { language: string }) =>
  post('auto-reply/test/', body, true) as Promise<{ status: string; to: string }>;
