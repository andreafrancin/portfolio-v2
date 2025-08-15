import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './locales/es/translation.json';
import en from './locales/en/translation.json';
import ca from './locales/ca/translation.json';

void i18n.use(initReactI18next).init({
  fallbackLng: 'es',
  supportedLngs: ['es', 'en', 'ca'],
  resources: {
    es: { translation: es },
    en: { translation: en },
    ca: { translation: ca },
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
