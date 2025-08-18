import { useCallback, useRef, useState } from 'react';
import ArrowIcon from '../icons/icon-arrow';
import './index.scss';

interface LangMenuProps {
  lang: string;
  handleChangeLanguage: any;
}

function LangMenu({ lang, handleChangeLanguage }: LangMenuProps) {
  const [hidden, setHidden] = useState(false);

  const getSelectedLangClass = useCallback(
    (value: string) => (lang === value ? 'selected' : ''),
    [lang]
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleChangeLanguage(event);
    setHidden(true);
    setTimeout(() => setHidden(false), 0);
  };

  return (
    <div className="header-lang-container">
      <div className="header-lang">{lang}</div>
      <div className="header-arrow-icon">
        <ArrowIcon width={20} height={20} color="#141516" />
      </div>
      <ul className={`header-lang-box ${hidden ? 'is-hidden' : ''}`}>
        <li className="header-lang-box-element">
          <button
            onClick={handleClick}
            value="en"
            className={`header-lang-button ${getSelectedLangClass('en')}`}
          >
            en
          </button>
        </li>
        <li className="header-lang-box-element">
          <button
            onClick={handleClick}
            value="es"
            className={`header-lang-button ${getSelectedLangClass('es')}`}
          >
            es
          </button>
        </li>
        <li className="header-lang-box-element">
          <button
            onClick={handleClick}
            value="ca"
            className={`header-lang-button ${getSelectedLangClass('ca')}`}
          >
            cat
          </button>
        </li>
      </ul>
    </div>
  );
}

export default LangMenu;
