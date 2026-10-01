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
  return pdf(<BillingPdf doc={doc} issuer={issuer} logo={logo} lang={lang} />).toBlob();
}
