import thin from '../../../../assets/fonts/billing/Raleway-100.ttf';
import light from '../../../../assets/fonts/billing/Raleway-300.ttf';
import regular from '../../../../assets/fonts/billing/Raleway-400.ttf';
import semibold from '../../../../assets/fonts/billing/Raleway-600.ttf';
import bold from '../../../../assets/fonts/billing/Raleway-700.ttf';
import extrabold from '../../../../assets/fonts/billing/Raleway-800.ttf';
import italic from '../../../../assets/fonts/billing/Raleway-400-italic.ttf';
import semiboldItalic from '../../../../assets/fonts/billing/Raleway-600-italic.ttf';
import logo from '../../../../assets/images/logo/logo-document.png';
import { pdf } from '@react-pdf/renderer';
import { BillingPdf, registerBillingFonts } from './document-pdf';
import type { BillingDocument, DocLanguage, Issuer } from '../../../../lib/billing';

registerBillingFonts({ thin, light, regular, semibold, bold, extrabold, italic, semiboldItalic });

export async function renderDocumentPdf(
  doc: BillingDocument,
  issuer: Issuer,
  lang?: DocLanguage
): Promise<Blob> {
  let pages = 0;
  const count = (n: number) => {
    pages = n;
  };
  const props = { doc, issuer, logo, lang, onPageCount: count };
  const normal = await pdf(<BillingPdf {...props} />).toBlob();
  if (pages <= 1) return normal;

  // The layout spilled onto another page. Retry with tighter spacing and keep
  // it only if that removes the extra page; otherwise the original design wins.
  const spilled = pages;
  pages = 0;
  const compact = await pdf(<BillingPdf {...props} compact />).toBlob();
  return pages > 0 && pages < spilled ? compact : normal;
}
