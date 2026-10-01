import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../context/lang-context';
import { AuthContext } from '../../context/auth-context';
import useScrollDirection from '../../hooks/useScrollDirection';
import useHtmlScrollLock from '../../hooks/useHtmlScrollLock';
import { useTouchPress } from '../../hooks/useTouchSpotlight';
import LogoIcon from '../icons/icon-logo';
import Vine from '../storybook/vine';
import { IconClose, IconInstagram, IconLinkedin, IconMenu, IconMail } from '../icons';
import { CONTACT_EMAIL, INSTAGRAM_URL, LINKEDIN_URL } from '../../config/site';
import './index.scss';

const NAV = [
  { path: '/work', key: 'HEADER.WORK' },
  { path: '/about', key: 'HEADER.ABOUT' },
  { path: '/contact', key: 'HEADER.CONTACT' },
];

const LANGS = [
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'ca', label: 'CA', name: 'Català' },
  { code: 'en', label: 'EN', name: 'English' },
] as const;

function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  const { t } = useTranslation();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('HEADER.LANGUAGE')}>
      {LANGS.map(({ code, label, name }) => (
        <button
          key={code}
          type="button"
          lang={code}
          className="lang-switch__btn"
          aria-pressed={lang === code}
          aria-label={name}
          onClick={() => setLang(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

interface HeaderProps {
  variant: 'public' | 'studio';
}

function Header({ variant }: HeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { token } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const { hidden, scrolled } = useScrollDirection(160);
  const logoPress = useTouchPress();

  useHtmlScrollLock(menuOpen);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const isHidden = hidden && !menuOpen;
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--header-offset',
      isHidden ? '0px' : 'var(--header-h)'
    );
  }, [isHidden]);

  const isWorkActive = location.pathname === '/work' || location.pathname.startsWith('/work/');

  return (
    <header
      className={`site-header${scrolled ? ' is-scrolled' : ''}${isHidden ? ' is-hidden' : ''}${
        menuOpen ? ' is-open' : ''
      } site-header--${variant}`}
    >
      <div className="site-header__bar">
        <nav className="site-nav" aria-label="Main">
          <ul className="site-nav__list">
            {NAV.map(({ path, key }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `site-nav__link${isActive || (path === '/work' && isWorkActive) ? ' is-active' : ''}`
                  }
                >
                  {t(key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          to="/work"
          className={`site-header__logo${logoPress.pressed ? ' is-pressed' : ''}`}
          aria-label={t('HEADER.HOME')}
          onPointerDown={logoPress.onPointerDown}
        >
          <LogoIcon color="currentColor" />
        </Link>

        <div className="site-header__tools">
          {variant === 'studio' && token && (
            <span className="site-header__studio">{t('PRIVATE.STUDIO')}</span>
          )}
          <a
            className="site-header__social"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <IconInstagram size={19} />
          </a>
          <a
            className="site-header__social"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <IconLinkedin size={18} />
          </a>
          <LangSwitch />
        </div>

        <button
          type="button"
          className="site-header__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? t('HEADER.CLOSE_MENU') : t('HEADER.MENU')}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
        </button>
      </div>

      {createPortal(
        <div id="mobile-menu" className="mobile-menu" hidden={!menuOpen}>
          <nav aria-label="Main">
            <ul className="mobile-menu__list">
              {NAV.map(({ path, key }, i) => (
                <li key={path} style={{ '--i': i } as React.CSSProperties}>
                  <NavLink
                    to={path}
                    className={({ isActive }) =>
                      `mobile-menu__link${isActive || (path === '/work' && isWorkActive) ? ' is-active' : ''}`
                    }
                  >
                    {t(key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {menuOpen && <Vine className="mobile-menu__vine" />}
          <div className="mobile-menu__foot">
            <LangSwitch className="lang-switch--lg" />
            <div className="mobile-menu__links">
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <IconMail size={18} /> {CONTACT_EMAIL}
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                <IconInstagram size={18} /> Instagram
              </a>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                <IconLinkedin size={18} /> LinkedIn
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}

export default Header;
