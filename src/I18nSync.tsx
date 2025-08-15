import { useEffect } from 'react';
import i18n from './i18n';
import { useLang } from './context/lang-context';

export default function I18nSync() {
  const { lang } = useLang();

  useEffect(() => {
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
  }, [lang]);

  return null;
}
