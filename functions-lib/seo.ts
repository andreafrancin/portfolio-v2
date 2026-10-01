import {
  DEFAULT_LANG,
  headTags,
  isSeoLang,
  renderHeadTags,
  SeoInput,
  SeoLang,
} from '../src/seo/meta';

declare const HTMLRewriter: any;

export const API = 'https://back.andreafrancin.com/api';

export function langOf(request: Request): SeoLang {
  const value = new URL(request.url).searchParams.get('lang');
  return isSeoLang(value) ? value : DEFAULT_LANG;
}

export async function fetchJson(
  url: string,
  ttl = 300,
  timeoutMs = 3500
): Promise<any | null | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cf: { cacheTtl: ttl, cacheEverything: true },
    } as RequestInit);
    if (response.status === 404) return null;
    if (!response.ok) return undefined;
    return await response.json();
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

export async function withSeo(
  context: any,
  build: (lang: SeoLang) => Omit<SeoInput, 'lang' | 'path'> & { path?: string },
  status?: number
): Promise<Response> {
  const response: Response = await context.next();
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;
  const lang = langOf(context.request);
  const input = build(lang);
  const seo: SeoInput = { ...input, path: input.path || new URL(context.request.url).pathname, lang };
  const tags = renderHeadTags(headTags(seo));
  const rewritten: Response = new HTMLRewriter()
    .on('html', { element: (el: any) => el.setAttribute('lang', lang) })
    .on('title', { element: (el: any) => el.setInnerContent(seo.title) })
    .on('[data-seo]', { element: (el: any) => el.remove() })
    .on('head', { element: (el: any) => el.append(tags, { html: true }) })
    .transform(response);
  if (!status) return rewritten;
  return new Response(rewritten.body, { status, headers: rewritten.headers });
}
