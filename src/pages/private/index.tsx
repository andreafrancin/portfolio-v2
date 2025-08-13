import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import LogoutButton from '../../components/logout';
import EditContainer from './edit-container';

const PrivateArea = () => {
  const navigate = useNavigate();

  const isTokenExpired = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { exp } = JSON.parse(jsonPayload);
      if (!exp) return true;
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="private-area-container">
      <h1>Private Area</h1>
      <div className="private-area-logout-container">
        <LogoutButton />
      </div>
      <EditContainer></EditContainer>
    </div>
  );
};

export default PrivateArea;
