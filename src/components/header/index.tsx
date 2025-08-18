import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LinkedinIcon from '../icons/icon-linkedin';
import useScrollPosition from '../../hooks/useScrollPosition';
import ArrowIcon from '../icons/icon-arrow';
import { paths as initialPaths } from './config';
import { useLang } from '../../context/lang-context';
import { useStickyFixedHeader } from '../../hooks/useStickyFixedHeader';
import { useTranslation } from 'react-i18next';
import './index.scss';
import LogoIcon from '../icons/icon-logo';
import LangMenu from './lang-menu';
import useIsMobile from '../../hooks/useIsMobile';

type PathItem = { path: string; selected?: boolean; title: string };
type Paths = Record<string, PathItem>;

function Header() {
  const [navPaths, setNavPaths] = useState<Paths>(initialPaths as Paths);

  const scrolled = useScrollPosition(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const { t } = useTranslation();
  const isMobile = useIsMobile(1000);

  useStickyFixedHeader();

  useEffect(() => {
    const updated: Paths = Object.fromEntries(
      Object.entries(navPaths).map(([key, item]) => [
        key,
        { ...item, selected: item.path === location.pathname },
      ])
    ) as Paths;
    setNavPaths(updated);
  }, [location.pathname]);

  const handleChangeLanguage = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const value = (event.currentTarget as HTMLButtonElement).value as 'es' | 'en' | 'ca';
      setLang(value);
    },
    [setLang]
  );

  const handleNavigateToPage = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const containerClasses = useMemo(
    () => `header-container ${scrolled ? 'scrolled' : ''}`,
    [scrolled]
  );

  return (
    <div className={containerClasses}>
      <div className="header-logo-container">
        <LogoIcon color="#141516" />
      </div>

      <div className="header-content">
        <ul className="header-list-container">
          <>
            {Object.entries(navPaths).map(([key, { path, selected, title }]) => (
              <li key={key} className="header-list-element">
                <button
                  onClick={() => handleNavigateToPage(path)}
                  className={`header-link ${selected ? 'header-link-selected' : ''}`}
                >
                  {t(title)}
                </button>
              </li>
            ))}
            {isMobile && <LangMenu handleChangeLanguage={handleChangeLanguage} lang={lang} />}
          </>
        </ul>

        {!isMobile && (
          <ul className="header-social-list-container">
            <a
              href="https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://es.linkedin.com/in/andrea-franc%25C3%25ADn-pedrola-730aa910a&ved=2ahUKEwjh8KGDlJSPAxWRRaQEHWEAFhsQFnoECBcQAQ&usg=AOvVaw2yKoOmk0oiPl0i2CGKB6Pz"
              target="_blank"
              className="header-social-icon"
            >
              <LinkedinIcon width={20} height={20} color="#141516" />
            </a>
          </ul>
        )}

        {!isMobile && <LangMenu handleChangeLanguage={handleChangeLanguage} lang={lang} />}
      </div>
    </div>
  );
}

export default Header;
