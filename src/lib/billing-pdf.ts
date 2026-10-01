import type { BillingDocument, DocLanguage, Issuer } from './billing';
import { documentFileName } from './billing';

export async function renderPdf(
  doc: BillingDocument,
  issuer: Issuer,
  lang?: DocLanguage
): Promise<Blob> {
  const mod = await import(
    /* webpackChunkName: "billing-pdf" */ '../pages/private/billing/pdf/render'
  );
  return mod.renderDocumentPdf(doc, issuer, lang);
}

export async function downloadPdf(doc: BillingDocument, issuer: Issuer, lang?: DocLanguage) {
  const language = lang || doc.content.language || 'ca';
  const blob = await renderPdf(doc, issuer, language);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = documentFileName(doc, language);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
