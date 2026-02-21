import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';
import AnalysisView from './AnalysisView';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshGallery, setRefreshGallery] = useState(0);

  const handleUploadSuccess = () => {
    setActiveTab('gallery');
    setRefreshGallery(prev => prev + 1);
  };

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm'))) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-top-row">
          <button className="lang-toggle" onClick={toggleLanguage}>
            {language === 'ko' ? 'EN' : 'KO'}
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            {t('auth.logout')}
          </button>
        </div>
        <h1>{t('common.appName')}</h1>
        <p>{t('common.appSlogan')}</p>
        <div className="privacy-badge">
          <span className="privacy-icon">&#128274;</span> {t('security.localOnly')}
        </div>
      </header>

      <nav className="dashboard-tabs">
        <button
          className={activeTab === 'upload' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('upload')}
        >
          {t('dashboard.tabUpload')}
        </button>
        <button
          className={activeTab === 'gallery' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('gallery')}
        >
          {t('dashboard.tabGallery')}
        </button>
        <button
          className={activeTab === 'analysis' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('analysis')}
        >
          {t('dashboard.tabAnalysis')}
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'upload' && (
          <PhotoUpload onUploadSuccess={handleUploadSuccess} />
        )}
        {activeTab === 'gallery' && (
          <PhotoGallery key={refreshGallery} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisView />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
