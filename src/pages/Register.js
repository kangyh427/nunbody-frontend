import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function Register() {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      alert(t('auth.registerSuccess'));
      navigate('/login');
    } catch (err) {
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else if (typeof err.response?.data?.error === 'string') {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t('auth.registerFailed'));
      }
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
        <h2>{t('auth.registerTitle')}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder={t('auth.username')}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            disabled={loading}
          />
          <input
            type="email"
            name="email"
            placeholder={t('auth.email')}
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder={t('auth.password')}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder={t('auth.confirmPassword')}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? t('auth.registerLoading') : t('auth.register')}
          </button>
        </form>
        <p>{t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link></p>
      </div>
    </div>
  );
}

export default Register;
