import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import Footer from '../components/Footer';
import './Support.css';

function Support() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: '',
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load user info
  useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    } catch {
      // ignore
    }
  });

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      alert(t('cs.attachPhotoDesc'));
      return;
    }

    const newPhotos = files
      .filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setPhotos(prev => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePhotoRemove = (index) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('category', formData.category);
      data.append('subject', formData.subject);
      data.append('message', formData.message);

      photos.forEach((photo) => {
        data.append('photos', photo.file);
      });

      await api.post('/api/support/inquiry', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setFormData(prev => ({ ...prev, category: 'general', subject: '', message: '' }));
      photos.forEach(p => URL.revokeObjectURL(p.preview));
      setPhotos([]);
    } catch (err) {
      setError(err.response?.data?.message || t('cs.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-page">
      <header className="support-header">
        <button className="support-back-btn" onClick={() => navigate('/dashboard')}>
          &#8592;
        </button>
        <span className="support-header-title">{t('cs.title')}</span>
      </header>

      <div className="support-hero">
        <div className="support-hero-icon">&#128172;</div>
        <div className="support-hero-title">{t('cs.subtitle')}</div>
        <div className="support-hero-desc">{t('cs.desc')}</div>
      </div>

      <div className="support-body">
        {success && (
          <div className="support-success">{t('cs.sent')}</div>
        )}
        {error && (
          <div className="support-error">{error}</div>
        )}

        {/* Email Inquiry Form */}
        <form className="support-form-section" onSubmit={handleSubmit}>
          <div className="support-form-title">
            <span className="support-form-icon">&#9993;</span>
            {t('cs.emailTitle')}
          </div>

          <div className="support-field">
            <label className="support-label">{t('cs.name')}</label>
            <input
              className="support-input"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="support-field">
            <label className="support-label">{t('cs.email')}</label>
            <input
              className="support-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="support-field">
            <label className="support-label">{t('cs.category')}</label>
            <select
              className="support-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={loading}
            >
              <option value="general">{t('cs.categoryGeneral')}</option>
              <option value="bug">{t('cs.categoryBug')}</option>
              <option value="account">{t('cs.categoryAccount')}</option>
              <option value="suggestion">{t('cs.categorySuggestion')}</option>
            </select>
          </div>

          <div className="support-field">
            <label className="support-label">{t('cs.subject')}</label>
            <input
              className="support-input"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="support-field">
            <label className="support-label">{t('cs.message')}</label>
            <textarea
              className="support-textarea"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={t('cs.messagePlaceholder')}
              required
              disabled={loading}
            />
          </div>

          {/* Photo Attachment */}
          <div className="support-attach">
            <div className="support-attach-label">
              {t('cs.attachPhoto')}
              <span className="support-attach-desc">{t('cs.attachPhotoDesc')}</span>
            </div>

            <button
              type="button"
              className="support-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={photos.length >= 5 || loading}
            >
              &#128247; {t('cs.attachPhoto')}
            </button>
            <input
              ref={fileInputRef}
              className="support-attach-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoAdd}
            />

            {photos.length > 0 && (
              <div className="support-photo-preview">
                {photos.map((photo, index) => (
                  <div key={index} className="support-photo-item">
                    <img src={photo.preview} alt="" />
                    <button
                      type="button"
                      className="support-photo-remove"
                      onClick={() => handlePhotoRemove(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="support-submit-btn" disabled={loading}>
            {loading ? t('cs.sending') : t('cs.send')}
          </button>
        </form>

        {/* FAQ Section */}
        <div className="support-faq">
          <div className="support-faq-title">
            &#10068; {t('cs.faqTitle')}
          </div>

          <div className="faq-item">
            <div className="faq-question">{t('cs.faq1Q')}</div>
            <div className="faq-answer">{t('cs.faq1A')}</div>
          </div>

          <div className="faq-item">
            <div className="faq-question">{t('cs.faq2Q')}</div>
            <div className="faq-answer">{t('cs.faq2A')}</div>
          </div>

          <div className="faq-item">
            <div className="faq-question">{t('cs.faq3Q')}</div>
            <div className="faq-answer">{t('cs.faq3A')}</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Support;
