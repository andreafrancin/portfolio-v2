import { useContext, useState } from 'react';
import useSecretCombo from '../../hooks/useSecretCombo';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/auth-context';
import { CONTACT_EMAIL, INSTAGRAM_URL, LINKEDIN_URL } from '../../config/site';
import { IconArrowUpRight, IconArrowRight } from '../icons';
import InkStrip from '../ink-strip';
import Vine from '../storybook/vine';
import './index.scss';

function Footer({ showCta = true }: { showCta?: boolean }) {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  const year = new Date().getFullYear();

  const [showPrivate, setShowPrivate] = useState(() => {
    try {
      return localStorage.getItem('af.privateLink') === '1';
    } catch {
      return false;
    }
  });
  useSecretCombo(() =>
    setShowPrivate((v) => {
      try {
        localStorage.setItem('af.privateLink', v ? '0' : '1');
      } catch {}
      return !v;
    })
  );

  return (
    <footer className="site-footer">
      <div className="site-footer__body">
        <Vine className="site-footer__vine" />
        <div className="site-footer__inner">
          {showCta && (
            <div className="site-footer__cta" data-reveal>
              <p className="site-footer__cta-title">{t('FOOTER.CTA')}</p>
              <Link to="/contact" className="site-footer__cta-link">
                <span>{t('FOOTER.CTA_LINK')}</span>
                <IconArrowRight size={36} />
              </Link>
            </div>
          )}

          <div className="site-footer__grid">
            <div className="site-footer__col">
              <p className="site-footer__label">{t('CONTACT.EMAIL')}</p>
              <a className="site-footer__email" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className="site-footer__col">
              <p className="site-footer__label">{t('FOOTER.PAGES')}</p>
              <ul>
                <li>
                  <Link to="/work">{t('HEADER.WORK')}</Link>
                </li>
                <li>
                  <Link to="/about">{t('HEADER.ABOUT')}</Link>
                </li>
                <li>
                  <Link to="/contact">{t('HEADER.CONTACT')}</Link>
                </li>
              </ul>
            </div>
            <div className="site-footer__col">
              <p className="site-footer__label">{t('FOOTER.ELSEWHERE')}</p>
              <ul>
                <li>
                  <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                    Instagram <IconArrowUpRight size={14} />
                  </a>
                </li>
                <li>
                  <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                    LinkedIn <IconArrowUpRight size={14} />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="site-footer__base">
            <InkStrip />
            <p>
              © {year} Andrea Francín. {t('FOOTER.RIGHTS')}
            </p>
            <Link className="site-footer__legal" to="/legal">
              {t('FOOTER.LEGAL')}
            </Link>
            {showPrivate && (
              <Link className="site-footer__private" to={token ? '/private' : '/login'}>
                {t('FOOTER.PRIVATE')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
