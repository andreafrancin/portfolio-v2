import { useContext, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/auth-context';
import useHtmlScrollLock from '../../hooks/useHtmlScrollLock';
import { LangSwitch } from '../header';
import { IconArrowUpRight, IconClose, IconLogout, IconMenu } from '../icons';
import LogoIcon from '../icons/icon-logo';
import { ADMIN_NAVIGATION, isCurrentItem } from './navigation';
import './index.scss';

function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useHtmlScrollLock(isMenuOpen);
  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setIsMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const logOut = () => {
    setToken(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__brand-row">
          <Link to="/private" className="admin__brand" aria-label={t('PRIVATE.PRIVATE_AREA_TITLE')}>
            <LogoIcon color="currentColor" />
            <span className="admin__brand-tag">{t('PRIVATE.STUDIO')}</span>
          </Link>
          <button
            type="button"
            className="admin__menu-button"
            aria-expanded={isMenuOpen}
            aria-controls="admin-navigation"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            {isMenuOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
            {t(isMenuOpen ? 'ADMIN.CLOSE_MENU' : 'ADMIN.MENU')}
          </button>
        </div>

        <nav
          id="admin-navigation"
          className="admin__navigation"
          data-open={isMenuOpen}
          aria-label={t('ADMIN.NAV_LABEL')}
        >
          {ADMIN_NAVIGATION.map((group) => (
            <div key={group.titleKey} className="admin__group">
              <p className="admin__group-title">{t(group.titleKey)}</p>
              <ul className="admin__items">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="admin__item"
                      aria-current={isCurrentItem(item, location.pathname) ? 'page' : undefined}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="admin__footer">
            <div className="admin__language">
              <span className="admin__language-label">{t('ADMIN.INTERFACE_LANGUAGE')}</span>
              <LangSwitch />
            </div>
            <a className="admin__item" href="/work" target="_blank" rel="noreferrer">
              {t('ADMIN.VIEW_SITE')} <IconArrowUpRight size={16} />
            </a>
            <button type="button" className="admin__item" onClick={logOut}>
              {t('PRIVATE.LOGOUT')} <IconLogout size={16} />
            </button>
          </div>
        </nav>
      </aside>

      <div className="admin__main">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
