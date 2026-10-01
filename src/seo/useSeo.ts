import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../context/lang-context';
import { headTags, SeoInput } from './meta';

type Options = Omit<SeoInput, 'path' | 'lang'> & { path?: string };

export default function useSeo(options: Options | null) {
  const { lang } = useLang();
  const { pathname } = useLocation();
  const key = options ? JSON.stringify(options) : '';

  useEffect(() => {
    if (!options) return;
    const tags = headTags({ ...options, path: options.path || pathname, lang });
    document.title = options.title;
    const wanted = new Set(tags.map((t) => t.key));
    document.head.querySelectorAll<HTMLElement>('[data-seo]').forEach((el) => {
      if (!wanted.has(el.dataset.seo!)) el.remove();
    });
    for (const { key: k, tag, attrs, text } of tags) {
      let el = document.head.querySelector<HTMLElement>(`[data-seo="${CSS.escape(k)}"]`);
      if (!el || el.tagName.toLowerCase() !== tag) {
        el?.remove();
        el = document.createElement(tag);
        el.dataset.seo = k;
        document.head.appendChild(el);
      }
      for (const [name, value] of Object.entries(attrs)) {
        if (el.getAttribute(name) !== value) el.setAttribute(name, value);
      }
      if (text !== undefined && el.textContent !== text) el.textContent = text;
    }
  }, [key, lang, pathname]);
}
