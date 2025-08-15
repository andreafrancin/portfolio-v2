import { Link } from 'react-router-dom';
import './index.scss';
import { useContext, useMemo } from 'react';
import { AuthContext } from '../../context/auth-context';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { token } = useContext(AuthContext);
  const { t } = useTranslation();

  return (
    <div className="footer-container">
      <Link className="footer-login-button" to={token ? '/private' : '/login'}>
        {t('PRIVATE.PRIVATE_AREA_TITLE')}
      </Link>
    </div>
  );
};

export default Footer;
