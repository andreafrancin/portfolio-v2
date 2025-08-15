import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Lang = 'es' | 'en' | 'ca';

type LangContextValue = {
  lang: Lang;
  setLang: (value: Lang) => void;
};

const LangContext = createContext<LangContextValue | undefined>(undefined);

const LANG_STORAGE_KEY = 'app.lang';
const FALLBACK_LANG: Lang = 'es';

function getInitialLang(): Lang {
  const stored = typeof window !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) : null;
  if (stored === 'es' || stored === 'en' || stored === 'ca') return stored;

  const nav =
    typeof navigator !== 'undefined' ? navigator.language || navigator.languages?.[0] || '' : '';
  const prefix = nav.slice(0, 2).toLowerCase();
  if (prefix === 'es' || prefix === 'en' || prefix === 'ca') return prefix as Lang;

  return FALLBACK_LANG;
}

export const LangProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = (value: Lang) => {
    setLangState(value);
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
