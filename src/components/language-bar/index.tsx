import { useTranslation } from 'react-i18next';
import './index.scss';

export const CONTENT_LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'ca', name: 'Català' },
  { code: 'en', name: 'English' },
] as const;

interface LanguageBarProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  written: Record<string, boolean>;
}

function LanguageBar({ selectedLanguage, onLanguageChange, written }: LanguageBarProps) {
  const { t } = useTranslation();

  const selectByOffset = (currentIndex: number, offset: number, list: HTMLElement | null): void => {
    const count = CONTENT_LANGUAGES.length;
    const next = CONTENT_LANGUAGES[(currentIndex + offset + count) % count];

    onLanguageChange(next.code);
    list?.querySelector<HTMLElement>(`[data-language="${next.code}"]`)?.focus();
  };

  return (
    <div className="language-bar">
      <span className="language-bar__label" id="language-bar-label">
        {t('ADMIN.CONTENT_LANGUAGE')}
      </span>
      <div className="language-bar__tabs" role="tablist" aria-labelledby="language-bar-label">
        {CONTENT_LANGUAGES.map(({ code, name }, index) => {
          const isSelected = selectedLanguage === code;
          const isWritten = !!written[code];

          return (
            <button
              key={code}
              type="button"
              role="tab"
              lang={code}
              data-language={code}
              data-written={isWritten}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              className="language-bar__tab"
              onClick={() => onLanguageChange(code)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  selectByOffset(
                    index,
                    event.key === 'ArrowRight' ? 1 : -1,
                    event.currentTarget.parentElement
                  );
                }
              }}
            >
              <span className="language-bar__name">{name}</span>
              <span className="language-bar__status">
                <span className="language-bar__dot" aria-hidden="true" />
                <span className="language-bar__status-text">
                  {t(isWritten ? 'ADMIN.LANGUAGE_WRITTEN' : 'ADMIN.LANGUAGE_EMPTY')}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LanguageBar;
