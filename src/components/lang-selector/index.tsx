import './index.scss';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'ca', label: 'CA' },
] as const;

interface LangSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  contentByLang?: Record<string, string>;
}

function LangSelector({ selectedLanguage, onLanguageChange, contentByLang }: LangSelectorProps) {
  return (
    <div className="lang-tabs">
      {LANGUAGES.map(({ code, label }) => {
        const hasContent = contentByLang ? !!contentByLang[code]?.trim() : false;
        const isActive = selectedLanguage === code;

        return (
          <button
            key={code}
            type="button"
            className={`lang-tab ${isActive ? 'lang-tab--active' : ''} ${hasContent ? 'lang-tab--has-content' : ''}`}
            onClick={() => onLanguageChange(code)}
          >
            {label}
            {hasContent && !isActive && <span className="lang-tab-dot" />}
          </button>
        );
      })}
    </div>
  );
}

export default LangSelector;
