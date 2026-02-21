import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import Footer from '../components/Footer';
import './Settings.css';

function Settings() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    } catch {
      // ignore
    }
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/auth/profile', {
        name: formData.name,
        phone: formData.phone,
      });
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, name: formData.name, phone: formData.phone }));
      showMsg('success', t('settings.saved'));
    } catch (err) {
      showMsg('error', err.response?.data?.message || t('settings.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showMsg('error', t('settings.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await api.put('/api/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      showMsg('success', t('settings.passwordChanged'));
    } catch (err) {
      showMsg('error', err.response?.data?.message || t('settings.passwordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await api.delete('/api/auth/account', {
        data: { password: deletePassword },
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert(t('settings.accountDeleted'));
      navigate('/login');
    } catch (err) {
      showMsg('error', err.response?.data?.message || t('settings.deleteAccountFailed'));
      setShowDeleteModal(false);
      setDeletePassword('');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button className="settings-back-btn" onClick={() => navigate('/dashboard')}>
          &#8592;
        </button>
        <span className="settings-header-title">{t('settings.title')}</span>
      </header>

      <div className="settings-body">
        {message.text && (
          <div className={message.type === 'success' ? 'settings-success' : 'settings-error'}>
            {message.text}
          </div>
        )}

        {/* Personal Info Section */}
        <form className="settings-section" onSubmit={handleSaveProfile}>
          <div className="settings-section-title">
            <span className="settings-section-icon">&#128100;</span>
            {t('settings.personalInfo')}
          </div>

          <div className="settings-field">
            <label className="settings-label">{t('settings.name')}</label>
            <input
              className="settings-input"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">{t('settings.phone')}</label>
            <input
              className="settings-input"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-0000-0000"
              disabled={loading}
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">{t('settings.email')}</label>
            <input
              className="settings-input"
              type="email"
              value={formData.email}
              disabled
            />
          </div>

          <button type="submit" className="settings-save-btn" disabled={loading}>
            {t('settings.saveChanges')}
          </button>
        </form>

        {/* Password Section */}
        <form className="settings-section" onSubmit={handleChangePassword}>
          <div className="settings-section-title">
            <span className="settings-section-icon">&#128272;</span>
            {t('settings.changePassword')}
          </div>

          <div className="settings-field">
            <label className="settings-label">{t('settings.currentPassword')}</label>
            <input
              className="settings-input"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">{t('settings.newPassword')}</label>
            <input
              className="settings-input"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">{t('settings.confirmNewPassword')}</label>
            <input
              className="settings-input"
              type="password"
              value={passwordData.confirmNewPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="password-change-btn" disabled={loading}>
            {t('settings.changePassword')}
          </button>
        </form>

        {/* Delete Account Section */}
        <div className="settings-section delete-section">
          <div className="settings-section-title">
            <span className="settings-section-icon">&#9888;</span>
            {t('settings.deleteAccount')}
          </div>
          <p className="delete-desc">{t('settings.deleteAccountDesc')}</p>
          <button
            className="delete-account-btn"
            onClick={() => setShowDeleteModal(true)}
          >
            {t('settings.deleteAccount')}
          </button>
        </div>
      </div>

      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">&#9888;&#65039;</div>
            <div className="modal-title">{t('settings.deleteAccount')}</div>
            <div className="modal-desc">{t('settings.deleteAccountConfirm')}</div>
            <input
              className="modal-input"
              type="password"
              placeholder={t('settings.deleteAccountPassword')}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
            />
            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                className="modal-delete-btn"
                onClick={handleDeleteAccount}
                disabled={!deletePassword || deleting}
              >
                {deleting ? '...' : t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
