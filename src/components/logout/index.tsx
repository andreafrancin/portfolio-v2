import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import './index.scss';
import Button from '../button';
import { useTranslation } from 'react-i18next';

const LogoutButton = () => {
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return <Button onClick={handleLogout}>{t('PRIVATE.LOGOUT')}</Button>;
};

export default LogoutButton;
