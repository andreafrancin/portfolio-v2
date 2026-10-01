import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft } from '../../components/icons';
import InkStrip from '../../components/ink-strip';
import useSeo from '../../seo/useSeo';
import { SITE_NAME } from '../../seo/meta';
import './index.scss';

function NotFound() {
  const { t } = useTranslation();
  useSeo({ title: `404 — ${SITE_NAME}`, description: '', noindex: true });
  return (
    <section className="not-found">
      <InkStrip className="not-found__strip" />
      <h1 className="not-found__title">404</h1>
      <p className="not-found__lead">{t('NOT_FOUND.TITLE')}</p>
      <p className="not-found__text">{t('NOT_FOUND.TEXT')}</p>
      <Link to="/work" className="text-link">
        <IconArrowLeft size={18} /> {t('NOT_FOUND.BACK')}
      </Link>
    </section>
  );
}

export default NotFound;
