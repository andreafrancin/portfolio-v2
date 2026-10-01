import { del, get, patch, post, put } from '../../api-client/api-client';
import type { BillingDocument, Client, Condition, DocumentKind, Issuer } from '../../lib/billing';

export const fetchIssuer = (): Promise<Issuer> => get('billing/issuer/', true);
export const saveIssuer = (body: Partial<Issuer>): Promise<Issuer> =>
  put('billing/issuer/', body, true);

export const fetchClients = (search = ''): Promise<Client[]> =>
  get(`billing/clients/${search ? `?search=${encodeURIComponent(search)}` : ''}`, true);
export const createClient = (body: Partial<Client>): Promise<Client> =>
  post('billing/clients/', body, true);
export const updateClient = (id: number, body: Partial<Client>): Promise<Client> =>
  patch(`billing/clients/${id}/`, body, true);

export const deleteClient = (id: number) => del(`billing/clients/${id}/`, true);

export const fetchConditions = (): Promise<Condition[]> => get('billing/conditions/', true);
export const createCondition = (body: Partial<Condition>): Promise<Condition> =>
  post('billing/conditions/', body, true);
export const updateCondition = (id: number, body: Partial<Condition>): Promise<Condition> =>
  patch(`billing/conditions/${id}/`, body, true);
export const deleteCondition = (id: number) => del(`billing/conditions/${id}/`, true);

export const fetchDocuments = (kind: DocumentKind): Promise<BillingDocument[]> =>
  get(`billing/documents/?kind=${kind}`, true);
export const fetchDocument = (id: number): Promise<BillingDocument> =>
  get(`billing/documents/${id}/`, true);
export const createDocument = (body: Partial<BillingDocument>): Promise<BillingDocument> =>
  post('billing/documents/', body, true);
export const updateDocument = (
  id: number,
  body: Partial<BillingDocument>
): Promise<BillingDocument> => put(`billing/documents/${id}/`, body, true);
export const patchDocument = (
  id: number,
  body: Partial<BillingDocument>
): Promise<BillingDocument> => patch(`billing/documents/${id}/`, body, true);
export const deleteDocument = (id: number) => del(`billing/documents/${id}/`, true);
export const fetchNextNumber = (
  kind: DocumentKind,
  year: number
): Promise<{ kind: DocumentKind; year: number; sequence: number; number: string }> =>
  get(`billing/documents/next-number/?kind=${kind}&year=${year}`, true);
export const duplicateDocument = (id: number): Promise<BillingDocument> =>
  post(`billing/documents/${id}/duplicate/`, {}, true);
export const quoteToInvoice = (id: number): Promise<BillingDocument> =>
  post(`billing/documents/${id}/to-invoice/`, {}, true);
