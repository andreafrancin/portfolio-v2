import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Spinner from '../../components/spinner';
import InkStrip from '../../components/ink-strip';
import { IconAlert, IconArrowLeft } from '../../components/icons';
import { login } from '../../services/login/api-request';
import { AuthContext } from '../../context/auth-context';
import useSecretCombo from '../../hooks/useSecretCombo';
import './index.scss';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setToken } = useContext(AuthContext);

  const [showForm, setShowForm] = useState(false);
  useSecretCombo(() => setShowForm((v) => !v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(false);

    try {
      const data = await login(username.trim(), password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      setToken(data.access);
      navigate('/private', { replace: true });
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  if (!showForm) return <section className="login" aria-hidden="true" />;

  return (
    <section className="login">
      <form onSubmit={handleSubmit} className="login__sheet" noValidate={false}>
        <InkStrip />
        <h1 className="login__title">{t('LOGIN.LOGIN_TITLE')}</h1>
        <p className="login__subtitle">{t('LOGIN.SUBTITLE')}</p>

        {error && (
          <p className="login__error" role="alert">
            <IconAlert size={18} /> {t('LOGIN.ERROR')}
          </p>
        )}

        <div className="field">
          <label className="field__label" htmlFor="login-user">
            {t('LOGIN.USERNAME')}
          </label>
          <input
            id="login-user"
            className="input"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-invalid={error || undefined}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="login-pass">
            {t('LOGIN.PASSWORD')}
          </label>
          <input
            id="login-pass"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error || undefined}
            required
          />
        </div>

        <button className="btn btn--block login__submit" type="submit" disabled={loading}>
          {loading ? <Spinner size={18} /> : t('LOGIN.SUBMIT')}
        </button>

        <Link to="/work" className="text-link login__back">
          <IconArrowLeft size={16} /> {t('LOGIN.BACK')}
        </Link>
      </form>
    </section>
  );
}

export default Login;
