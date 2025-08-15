import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import LinkedinIcon from '../icons/icon-linkedin';
import useScrollPosition from '../../hooks/useScrollPosition';
import ArrowIcon from '../icons/icon-arrow';
import { paths as initialPaths } from './config';
import './index.scss';
import { useLang } from '../../context/lang-context';
import { useStickyFixedHeader } from '../../hooks/useStickyFixedHeader';
import useHtmlScrollLock from '../../hooks/useHtmlScrollLock';

function Header() {
  const [navPaths, setNavPaths] = useState(initialPaths);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('');

  const scrolled = useScrollPosition(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  useStickyFixedHeader();
  useHtmlScrollLock(isMenuOpen);

  const handleChangeLanguage = (event: React.MouseEvent<HTMLButtonElement>) => {
    const value = (event.currentTarget as HTMLButtonElement).value as 'es' | 'en' | 'ca';
    setLang(value);
  };

  useEffect(() => {
    setSelectedLang(lang);
  }, [lang]);

  useEffect(() => {
    const updatedPaths: any = Object.fromEntries(
      Object.entries(navPaths).map(([key, item]) => [
        key,
        { ...item, selected: item.path === location.pathname },
      ])
    );
    setNavPaths(updatedPaths);
  }, [location]);

  const toggleMenuStatus = useCallback(() => {
    setIsMenuOpen((prevState) => !prevState);
  }, []);

  const openMenuClass = useMemo(() => {
    return isMenuOpen ? 'open' : '';
  }, [isMenuOpen]);

  const getSelectedLangClass = useCallback(
    (value: string) => {
      return lang === value ? 'selected' : '';
    },
    [lang]
  );

  const handleNavigateToPage = useCallback((path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  }, []);

  return (
    <div className={`header-container ${scrolled ? 'scrolled' : ''}`}>
      <div className={`header-logo-container`}>
        <h1 className="header-logo-title">Andrea Francín</h1>
      </div>
      <button onClick={toggleMenuStatus} className="burger-menu-button-container">
        <div className={`burger-menu-button ${openMenuClass}`}></div>
      </button>

      <div className={`header-content ${openMenuClass}`}>
        <ul className={`header-list-container ${openMenuClass}`}>
          {Object.entries(navPaths).map(([key, { path, selected }]) => (
            <li key={key} className={`header-list-element ${openMenuClass}`}>
              <button
                onClick={() => handleNavigateToPage(path)}
                className={`header-link ${selected ? 'header-link-selected' : ''} ${openMenuClass}`}
              >
                {key}
              </button>
            </li>
          ))}
        </ul>

        <ul className={`header-social-list-container ${openMenuClass}`}>
          <div className="header-social-icon">
            <LinkedinIcon width={20} height={20} color="#141516" />
          </div>
        </ul>

        <div className={`header-lang-container ${openMenuClass}`}>
          <div className={`header-lang ${openMenuClass}`}>{lang}</div>
          <div className={`header-arrow-icon ${openMenuClass}`}>
            <ArrowIcon width={20} height={20} color="#141516" />
          </div>
          <ul className={`header-lang-box ${openMenuClass}`}>
            <li className={`header-lang-box-element ${openMenuClass}`}>
              <button
                onClick={handleChangeLanguage}
                value="en"
                className={`header-lang-button ${openMenuClass} ${getSelectedLangClass('en')}`}
              >
                en
              </button>
            </li>
            <li className={`header-lang-box-element ${openMenuClass}`}>
              <button
                onClick={handleChangeLanguage}
                value="es"
                className={`header-lang-button ${openMenuClass} ${getSelectedLangClass('es')}`}
              >
                es
              </button>
            </li>
            <li className={`header-lang-box-element ${openMenuClass}`}>
              <button
                onClick={handleChangeLanguage}
                value="ca"
                className={`header-lang-button ${openMenuClass} ${getSelectedLangClass('ca')}`}
              >
                cat
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Header;
