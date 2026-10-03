import { MEDIA_HOST } from '../../src/config/site';

export const onRequest = async (context: any) => {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }
  const parts: string[] = Array.isArray(context.params.path)
    ? context.params.path
    : [context.params.path].filter(Boolean);
  if (!parts.length || parts.some((p) => !p || p === '..' || p === '.')) {
    return new Response('Not found', { status: 404 });
  }
  const upstream = await fetch(`https://${MEDIA_HOST}/${parts.map(encodeURIComponent).join('/')}`, {
    cf: { cacheTtl: 86400, cacheEverything: true },
  } as RequestInit);
  if (!upstream.ok) return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 });
  const type = upstream.headers.get('content-type') || '';
  if (!type.startsWith('image/')) return new Response('Not found', { status: 404 });
  return new Response(upstream.body, {
    headers: {
      'content-type': type,
      'cache-control': 'public, max-age=86400',
      'x-robots-tag': 'noindex',
    },
  });
};
