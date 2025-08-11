import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import LinkedinIcon from '../icons/icon-linkedin';
import useScrollPosition from '../../hooks/useScrollPosition';
import ArrowIcon from '../icons/icon-arrow';
import { paths as initialPaths } from './config';
import './index.scss';

function Header() {
  const scrolled = useScrollPosition(0);
  const location = useLocation();

  const [currentLang, setCurrentLang] = useState('es');
  const [navPaths, setNavPaths] = useState(initialPaths);

  const handleChangeLanguage = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCurrentLang(event.currentTarget.value);
  };

  useEffect(() => {
    const updatedPaths: any = Object.fromEntries(
      Object.entries(navPaths).map(([key, item]) => [
        key,
        { ...item, selected: item.path === location.pathname },
      ])
    );
    setNavPaths(updatedPaths);
  }, [location]);

  return (
    <div className={`header-container ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <ul className="header-list-container">
          <li className="header-list-element">
            <Link
              to={navPaths.work.path}
              className={`header-link ${navPaths.work.selected ? 'header-link-selected' : ''}`}
            >
              work
            </Link>
          </li>
          <li className="header-list-element">
            <Link
              to={navPaths.about.path}
              className={`header-link ${navPaths.about.selected ? 'header-link-selected' : ''}`}
            >
              about
            </Link>
          </li>
          <li className="header-list-element">
            <Link
              to={navPaths.contact.path}
              className={`header-link ${navPaths.contact.selected ? 'header-link-selected' : ''}`}
            >
              contact
            </Link>
          </li>
        </ul>
        <div className="header-logo-container">
          <h1 className="header-logo-title">Andrea Francín</h1>
        </div>
        <ul className="header-social-list-container">
          <div className="header-social-icon">
            <LinkedinIcon width={20} height={20} color="#141516" />
          </div>
        </ul>
        <div className="header-lang-container">
          <div className="header-lang">{currentLang}</div>
          <div className="header-arrow-icon">
            <ArrowIcon width={20} height={20} color="#141516" />
          </div>
          <ul className="header-lang-box">
            <li className="header-lang-box-element">
              <button onClick={handleChangeLanguage} value="en" className="header-lang-button">
                en
              </button>
            </li>
            <li className="header-lang-box-element">
              <button onClick={handleChangeLanguage} value="es" className="header-lang-button">
                es
              </button>
            </li>
            <li className="header-lang-box-element">
              <button onClick={handleChangeLanguage} value="ca" className="header-lang-button">
                ca
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Header;
