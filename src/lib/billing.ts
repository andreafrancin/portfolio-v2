export type DocumentKind = 'quote' | 'invoice';
export type DocumentLayout = 'concept' | 'numbered' | 'invoice';
export type TotalsStyle = 'table' | 'summary' | 'base';
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid';
export type DocLanguage = 'ca' | 'es' | 'en';
export const DOC_LANGUAGES: DocLanguage[] = ['ca', 'es', 'en'];

export const DEFAULT_LEAD: Record<DocLanguage, string> = {
  ca: 'Pressupost amb concepte:',
  es: 'Presupuesto con concepto:',
  en: 'Quote for:',
};

export interface Issuer {
  legal_name: string;
  tax_id: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  city: string;
  iban: string;
  quote_conditions: string;
}

export interface Client {
  id: number;
  name: string;
  tax_id: string;
  address: string;
  email: string;
  authorization_text: string;
  notes: string;
}

export interface Condition {
  id: number;
  title: string;
  text: string;
}

export interface ClientSnapshot {
  name: string;
  tax_id: string;
  address: string;
}

export interface DocumentLine {
  id: string;
  quantity: string;
  text: string;
  amount: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  quantity: string;
  body: string;
  lines: DocumentLine[];
}

export interface DocumentContent {
  language: DocLanguage;
  lead: string;
  concept: string;
  sections: DocumentSection[];
}

export interface BillingDocument {
  id?: number;
  kind: DocumentKind;
  year: number;
  sequence: number;
  number?: string;
  date: string;
  status: DocumentStatus;
  client: number | null;
  client_snapshot: ClientSnapshot;
  layout: DocumentLayout;
  content: DocumentContent;
  iva_rate: string;
  irpf_rate: string;
  totals_style: TotalsStyle;
  authorization_text: string;
  conditions_text: string;
  payment_text: string;
  base_amount?: string;
  iva_amount?: string;
  irpf_amount?: string;
  total_amount?: string;
  source_quote?: number | null;
  source_quote_number?: string | null;
  client_name?: string;
  updated_at?: string;
}

export function documentNumber(year: number, sequence: number): string {
  return `${String(year % 100).padStart(2, '0')}/${String(sequence).padStart(2, '0')}`;
}

export function documentFileName(
  doc: Pick<BillingDocument, 'kind' | 'year' | 'sequence'>,
  lang: DocLanguage = 'ca'
): string {
  const n = documentNumber(doc.year, doc.sequence).replace('/', '-');
  if (doc.kind === 'invoice') return `${lang === 'en' ? 'Invoice' : 'Factura'}_${n}.pdf`;
  const word = { ca: 'Pressupost', es: 'Presupuesto', en: 'Quote' }[lang];
  return `${n}_${word}_AndreaFrancín.pdf`;
}

export function formatDocDate(iso: string): string {
  const [y, m, d] = (iso || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  const raw = (value || '').toString().replace(/[€\s]/g, '');
  if (!raw) return NaN;
  let normalized = raw;
  if (raw.includes(',')) normalized = raw.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function formatMoney(n: number, withSymbol = true): string {
  const sign = n < 0 ? '-' : '';
  const [int, dec] = Math.abs(round2(n)).toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${grouped},${dec}${withSymbol ? ' €' : ''}`;
}

export function formatRate(rate: string | number): string {
  const n = parseAmount(String(rate));
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
}

export function lineAmountsTotal(section: DocumentSection): number {
  return section.lines.reduce((sum, l) => {
    const a = parseAmount(l.amount);
    return Number.isFinite(a) ? sum + a : sum;
  }, 0);
}

export function lineQuantitiesTotal(section: DocumentSection): number {
  return section.lines.reduce((sum, l) => {
    const q = parseAmount(l.quantity);
    return Number.isFinite(q) ? sum + q : sum;
  }, 0);
}

export function sectionPrice(section: DocumentSection): number | null {
  const typed = parseAmount(section.price);
  if (Number.isFinite(typed)) return typed;
  if (section.lines.some((l) => Number.isFinite(parseAmount(l.amount))))
    return lineAmountsTotal(section);
  return null;
}

export function sectionQuantity(section: DocumentSection): string {
  if (section.quantity.trim()) return section.quantity.trim();
  const q = lineQuantitiesTotal(section);
  return q ? String(q) : '';
}

export interface Totals {
  base: number;
  iva: number;
  irpf: number;
  total: number;
}

export function computeTotals(
  doc: Pick<BillingDocument, 'content' | 'iva_rate' | 'irpf_rate'> &
    Partial<Pick<BillingDocument, 'totals_style'>>
): Totals {
  const base = round2(
    doc.content.sections.reduce((sum, s) => {
      const p = sectionPrice(s);
      return p === null ? sum : sum + p;
    }, 0)
  );
  const baseOnly = doc.totals_style === 'base';
  const ivaRate = baseOnly ? 0 : parseAmount(doc.iva_rate) || 0;
  const irpfRate = baseOnly || doc.totals_style === 'summary' ? 0 : parseAmount(doc.irpf_rate) || 0;
  const iva = round2((base * ivaRate) / 100);
  const total = round2(base * (1 + ivaRate / 100 - irpfRate / 100));
  const irpf = round2(base + iva - total);
  return { base, iva, irpf, total };
}

let uid = 0;
export const newId = () => `${Date.now().toString(36)}-${(uid++).toString(36)}`;

export const emptyLine = (): DocumentLine => ({ id: newId(), quantity: '', text: '', amount: '' });

export const emptySection = (): DocumentSection => ({
  id: newId(),
  title: '',
  subtitle: '',
  price: '',
  quantity: '',
  body: '',
  lines: [],
});

export function newDocument(
  kind: DocumentKind,
  issuer: Issuer | null,
  layout?: DocumentLayout
): BillingDocument {
  const isInvoice = kind === 'invoice';
  const chosen: DocumentLayout = isInvoice ? 'invoice' : layout || 'concept';
  return {
    kind,
    year: new Date().getFullYear(),
    sequence: 0,
    date: todayIso(),
    status: 'draft',
    client: null,
    client_snapshot: { name: '', tax_id: '', address: '' },
    layout: chosen,
    content: {
      language: 'ca',
      lead: chosen === 'concept' ? DEFAULT_LEAD.ca : '',
      concept: '',
      sections: [isInvoice ? { ...emptySection(), lines: [emptyLine()] } : emptySection()],
    },
    iva_rate: '21',
    irpf_rate: chosen === 'numbered' ? '0' : '15',
    totals_style: chosen === 'numbered' ? 'summary' : 'table',
    authorization_text: '',
    conditions_text: isInvoice ? '' : issuer?.quote_conditions || '',
    payment_text: isInvoice ? issuer?.iban || '' : '',
  };
}

export function normalizeDocument(raw: BillingDocument): BillingDocument {
  const c = (raw.content || {}) as Partial<DocumentContent>;
  return {
    ...raw,
    client_snapshot: {
      name: raw.client_snapshot?.name || '',
      tax_id: raw.client_snapshot?.tax_id || '',
      address: raw.client_snapshot?.address || '',
    },
    content: {
      language: c.language === 'es' || c.language === 'en' ? c.language : 'ca',
      lead: c.lead || '',
      concept: c.concept || '',
      sections: (c.sections || []).map((s) => ({
        ...emptySection(),
        ...s,
        id: s.id || newId(),
        lines: (s.lines || []).map((l) => ({ ...emptyLine(), ...l, id: l.id || newId() })),
      })),
    },
  };
}
