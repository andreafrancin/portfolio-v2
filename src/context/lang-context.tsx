import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Lang = 'es' | 'en' | 'ca';

type LangContextValue = {
  lang: Lang;
  setLang: (value: Lang) => void;
};

const LangContext = createContext<LangContextValue | undefined>(undefined);

const LANG_STORAGE_KEY = 'app.lang';
const FALLBACK_LANG: Lang = 'es';

const isLang = (value: unknown): value is Lang =>
  value === 'es' || value === 'en' || value === 'ca';

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return FALLBACK_LANG;
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (isLang(fromUrl)) return fromUrl;
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {}
  return FALLBACK_LANG;
}

export function syncUrl(lang: Lang) {
  const url = new URL(window.location.href);
  if (lang === FALLBACK_LANG) url.searchParams.delete('lang');
  else url.searchParams.set('lang', lang);
  if (url.href !== window.location.href) {
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }
}

export const LangProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = (value: Lang) => {
    setLangState(value);
    syncUrl(value);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, value);
    } catch {}
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return ctx;
}

export function withLangParam(url: string, lang: Lang): string {
  try {
    const u = new URL(url, window.location.origin);
    u.searchParams.set('lang', lang);
    return u.toString().replace(window.location.origin, '');
  } catch {
    const hasQuery = url.includes('?');
    const join = hasQuery ? '&' : '?';
    return `${url}${join}lang=${lang}`;
  }
}
