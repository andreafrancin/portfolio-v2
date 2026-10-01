import {
  artworkJsonLd,
  pageUrl,
  plainExcerpt,
  PROJECT_FALLBACK,
  SITE_NAME,
} from '../../src/seo/meta';
import { API, fetchJson, langOf, withSeo } from '../../functions-lib/seo';

export const onRequest = async (context: any) => {
  const id = String(context.params.id || '');
  if (!/^\d+$/.test(id)) return context.next();
  const lang = langOf(context.request);
  const project = await fetchJson(`${API}/projects/${id}/`);

  if (project === null || project?.hidden) {
    return withSeo(
      context,
      (l) => ({ title: `404 — ${SITE_NAME}`, description: PROJECT_FALLBACK[l], noindex: true }),
      404
    );
  }
  if (!project) return context.next();

  const title = project.title_i18n?.[lang] || project.title || SITE_NAME;
  const description =
    plainExcerpt(
      project.content_i18n?.[lang]?.md || project.content_i18n?.es?.md || project.content
    ) || PROJECT_FALLBACK[lang];
  const images = project.images || [];
  const image = (images.find((i: any) => i.is_cover) || images[0])?.image_url || null;

  return withSeo(context, () => ({
    title: `${title} — ${SITE_NAME}`,
    description,
    image,
    type: 'article',
    jsonLd: artworkJsonLd({ title, description, url: pageUrl(`/work/${id}`, lang), image, lang }),
  }));
};
