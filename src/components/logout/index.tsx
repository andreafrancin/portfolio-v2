import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import './index.scss';
import Button from '../button';

const LogoutButton = () => {
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return <Button onClick={handleLogout}>Logout</Button>;
};

export default LogoutButton;
