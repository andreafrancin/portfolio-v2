export type SeoLang = 'es' | 'ca' | 'en';

export const SITE_URL = 'https://andreafrancin.com';
export const SITE_NAME = 'Andrea Francín';
export const SEO_LANGS: SeoLang[] = ['es', 'ca', 'en'];
export const DEFAULT_LANG: SeoLang = 'es';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const OG_LOCALE: Record<SeoLang, string> = { es: 'es_ES', ca: 'ca_ES', en: 'en_GB' };

type Localized = Record<SeoLang, string>;

export const PAGE_META: Record<
  'work' | 'about' | 'contact' | 'legal',
  { title: Localized; description: Localized }
> = {
  work: {
    title: {
      es: 'Andrea Francín — Ilustración y diseño gráfico',
      ca: 'Andrea Francín — Il·lustració i disseny gràfic',
      en: 'Andrea Francín — Illustration and graphic design',
    },
    description: {
      es: 'Portfolio de Andrea Francín, ilustradora y diseñadora gráfica: ilustración, branding, campañas y diseño editorial con un estilo delicado y lleno de color.',
      ca: 'Portfoli d’Andrea Francín, il·lustradora i dissenyadora gràfica: il·lustració, branding, campanyes i disseny editorial amb un estil delicat i ple de color.',
      en: 'Portfolio of Andrea Francín, illustrator and graphic designer: illustration, branding, campaigns and editorial design with a delicate, colourful style.',
    },
  },
  about: {
    title: {
      es: 'Sobre mí — Andrea Francín',
      ca: 'Sobre mi — Andrea Francín',
      en: 'About — Andrea Francín',
    },
    description: {
      es: 'Andrea Francín es ilustradora y diseñadora gráfica freelance: da vida a historias visuales a través del color, los detalles y la naturaleza.',
      ca: 'Andrea Francín és il·lustradora i dissenyadora gràfica freelance: dona vida a històries visuals a través del color, els detalls i la natura.',
      en: 'Andrea Francín is a freelance illustrator and graphic designer who brings visual stories to life through colour, detail and nature.',
    },
  },
  contact: {
    title: {
      es: 'Contacto — Andrea Francín',
      ca: 'Contacte — Andrea Francín',
      en: 'Contact — Andrea Francín',
    },
    description: {
      es: '¿Tienes un proyecto en mente? Escribe a Andrea Francín para encargos de ilustración, branding y diseño gráfico.',
      ca: 'Tens un projecte en ment? Escriu a Andrea Francín per a encàrrecs d’il·lustració, branding i disseny gràfic.',
      en: 'Have a project in mind? Write to Andrea Francín for illustration, branding and graphic design commissions.',
    },
  },
  legal: {
    title: {
      es: 'Aviso legal y privacidad — Andrea Francín',
      ca: 'Avís legal i privacitat — Andrea Francín',
      en: 'Legal notice and privacy — Andrea Francín',
    },
    description: {
      es: 'Titular, propiedad intelectual, reserva frente a la inteligencia artificial y privacidad de andreafrancin.com.',
      ca: 'Titular, propietat intel·lectual, reserva davant la intel·ligència artificial i privacitat d’andreafrancin.com.',
      en: 'Owner, intellectual property, artificial intelligence reservation and privacy of andreafrancin.com.',
    },
  },
};

export const PROJECT_FALLBACK: Localized = {
  es: 'Proyecto de ilustración y diseño gráfico de Andrea Francín.',
  ca: 'Projecte d’il·lustració i disseny gràfic d’Andrea Francín.',
  en: 'Illustration and graphic design project by Andrea Francín.',
};

export function isSeoLang(value: unknown): value is SeoLang {
  return value === 'es' || value === 'ca' || value === 'en';
}

export function pageUrl(path: string, lang: SeoLang): string {
  const clean = path === '/' ? '/work' : path.replace(/\/+$/, '') || '/work';
  return `${SITE_URL}${clean}${lang === DEFAULT_LANG ? '' : `?lang=${lang}`}`;
}

export function plainExcerpt(markdown: string | null | undefined, max = 158): string {
  const text = (markdown || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+.*$/gm, ' ')
    .replace(/[*_`>~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).trim()}…`;
}

export interface SeoInput {
  title: string;
  description: string;
  path: string;
  lang: SeoLang;
  image?: string | null;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  jsonLd?: object | null;
}

export interface HeadTag {
  key: string;
  tag: 'meta' | 'link' | 'script';
  attrs: Record<string, string>;
  text?: string;
}

export function headTags(input: SeoInput): HeadTag[] {
  const url = pageUrl(input.path, input.lang);
  const image = input.image || DEFAULT_IMAGE;
  const tags: HeadTag[] = [
    { key: 'description', tag: 'meta', attrs: { name: 'description', content: input.description } },
    {
      key: 'og:type',
      tag: 'meta',
      attrs: { property: 'og:type', content: input.type || 'website' },
    },
    { key: 'og:site_name', tag: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME } },
    { key: 'og:title', tag: 'meta', attrs: { property: 'og:title', content: input.title } },
    {
      key: 'og:description',
      tag: 'meta',
      attrs: { property: 'og:description', content: input.description },
    },
    { key: 'og:image', tag: 'meta', attrs: { property: 'og:image', content: image } },
    {
      key: 'og:locale',
      tag: 'meta',
      attrs: { property: 'og:locale', content: OG_LOCALE[input.lang] },
    },
    {
      key: 'twitter:card',
      tag: 'meta',
      attrs: { name: 'twitter:card', content: 'summary_large_image' },
    },
  ];
  if (input.noindex) {
    tags.push({
      key: 'robots',
      tag: 'meta',
      attrs: { name: 'robots', content: 'noindex, follow' },
    });
  } else {
    tags.push(
      { key: 'canonical', tag: 'link', attrs: { rel: 'canonical', href: url } },
      { key: 'og:url', tag: 'meta', attrs: { property: 'og:url', content: url } },
      ...SEO_LANGS.map((l) => ({
        key: `alternate:${l}`,
        tag: 'link' as const,
        attrs: { rel: 'alternate', hreflang: l, href: pageUrl(input.path, l) },
      })),
      {
        key: 'alternate:x-default',
        tag: 'link',
        attrs: { rel: 'alternate', hreflang: 'x-default', href: pageUrl(input.path, DEFAULT_LANG) },
      }
    );
  }
  if (input.jsonLd) {
    tags.push({
      key: 'jsonld',
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      text: JSON.stringify(input.jsonLd),
    });
  }
  return tags;
}

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderHeadTags(tags: HeadTag[]): string {
  return tags
    .map(({ key, tag, attrs, text }) => {
      const a = Object.entries({ ...attrs, 'data-seo': key })
        .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
        .join(' ');
      if (tag === 'script') return `<script ${a}>${(text || '').replace(/</g, '\\u003c')}</script>`;
      return `<${tag} ${a}>`;
    })
    .join('');
}

export function artworkJsonLd(project: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  lang: SeoLang;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: project.title,
    description: project.description,
    url: project.url,
    image: project.image || undefined,
    inLanguage: project.lang,
    creator: { '@type': 'Person', name: 'Andrea Francín', url: SITE_URL },
    copyrightHolder: { '@type': 'Person', name: 'Andrea Francín' },
  };
}
