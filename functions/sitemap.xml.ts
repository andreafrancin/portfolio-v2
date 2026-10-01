import { pageUrl, SEO_LANGS } from '../src/seo/meta';
import { API, fetchJson } from '../functions-lib/seo';

const STATIC_PATHS = ['/work', '/about', '/contact', '/legal'];

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const onRequest = async () => {
  const projects = (await fetchJson(`${API}/projects/`, 3600, 15000)) || [];
  const paths = [
    ...STATIC_PATHS,
    ...projects.filter((p: any) => !p.hidden).map((p: any) => `/work/${p.id}`),
  ];
  const urls = paths.flatMap((path) =>
    SEO_LANGS.map((lang) => {
      const alternates = SEO_LANGS.map(
        (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(pageUrl(path, l))}"/>`
      ).join('');
      return `<url><loc>${escapeXml(pageUrl(path, lang))}</loc>${alternates}<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(pageUrl(path, 'es'))}"/></url>`;
    })
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`;
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
