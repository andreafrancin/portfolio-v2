import { useTranslation } from 'react-i18next';
import './index.scss';

const LANGUAGES = [
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'ca', label: 'CAT', name: 'Català' },
  { code: 'en', label: 'EN', name: 'English' },
] as const;

interface LangSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  filled?: Record<string, boolean>;
}

function LangSelector({ selectedLanguage, onLanguageChange, filled }: LangSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="lang-tabs">
      <div className="lang-tabs__list" role="tablist" aria-label={t('HEADER.LANGUAGE')}>
        {LANGUAGES.map(({ code, label, name }) => {
          const isActive = selectedLanguage === code;
          return (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={name}
              className="lang-tabs__tab"
              onClick={() => onLanguageChange(code)}
              onKeyDown={(e) => {
                const i = LANGUAGES.findIndex((l) => l.code === code);
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const next =
                    LANGUAGES[
                      (i + (e.key === 'ArrowRight' ? 1 : LANGUAGES.length - 1)) % LANGUAGES.length
                    ];
                  onLanguageChange(next.code);
                  (
                    e.currentTarget.parentElement?.querySelector(
                      `[title="${next.name}"]`
                    ) as HTMLElement
                  )?.focus();
                }
              }}
              tabIndex={isActive ? 0 : -1}
            >
              {label}
              {filled?.[code] && <span className="lang-tabs__dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LangSelector;
