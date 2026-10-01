import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/auth-context';
import { StudioPageHeader } from '../../components/studio';
import { IconLogout } from '../../components/icons';
import EditContainer from './edit-container';

const PrivateArea = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setToken } = useContext(AuthContext);

  const logout = () => {
    setToken(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="studio">
      <StudioPageHeader
        title={t('PRIVATE.PRIVATE_AREA_TITLE')}
        actions={
          <button type="button" className="btn btn--quiet btn--sm" onClick={logout}>
            <IconLogout size={16} /> {t('PRIVATE.LOGOUT')}
          </button>
        }
      />
      <EditContainer />
    </div>
  );
};

export default PrivateArea;
