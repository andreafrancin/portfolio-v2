import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import { useTranslation } from 'react-i18next';
import Spinner from '../../components/spinner';

const API_BASE_URL = 'http://localhost:8000/api/';
const PROD_API_BASE_URL = 'https://back.andreafrancin.com/api/';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${PROD_API_BASE_URL}auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      navigate('/private', {
        replace: true,
      });
    } catch (err) {
      setError((err as Error).message);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form-container">
        <h1>{t('LOGIN.LOGIN_TITLE')}</h1>
        <div className="message-space">{error && <p>Error: {error}</p>}</div>
        <input
          className="login-form-input"
          type="text"
          placeholder={t('LOGIN.USERNAME')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="login-form-input"
          type="password"
          placeholder={t('LOGIN.PASSWORD')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="login-form-input-submit" type="submit">
          {loading ? <Spinner size={24} /> : t('LOGIN.SUBMIT')}
        </button>
      </form>
    </div>
  );
}

export default Login;
