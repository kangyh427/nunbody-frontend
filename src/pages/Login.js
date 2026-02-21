import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { getErrorMessage } from '../utils/errorHelper';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      if (response.data.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        navigate('/dashboard');
      } else if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        setError(t('auth.loginResponseError'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(getErrorMessage(err, t('auth.loginFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <button className="lang-toggle-auth" onClick={toggleLanguage}>
        {language === 'ko' ? 'EN' : 'KO'}
      </button>
      <div className="auth-box">
        <h2>{t('auth.loginTitle')}</h2>

        {error && <div className="error-message">{String(error)}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            id="email"
            name="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            id="password"
            name="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? t('auth.loginLoading') : t('auth.login')}
          </button>
        </form>

        <p className="auth-link">
          {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
