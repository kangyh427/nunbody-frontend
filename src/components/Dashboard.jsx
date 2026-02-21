import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';
import AnalysisView from './AnalysisView';
import Footer from './Footer';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState(null); // null = home view
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

  const userName = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.name || '';
    } catch {
      return '';
    }
  }, []);

  const motivation = useMemo(() => {
    const motivations = language === 'ko'
      ? [
          '꾸준함이 가장 큰 무기입니다.',
          '어제보다 나은 오늘을 만들어가요.',
          '작은 변화가 큰 결과를 만듭니다.',
          '당신의 노력은 배신하지 않습니다.',
          '지금 이 순간이 가장 빠른 시작입니다.',
        ]
      : [
          'Consistency is your greatest weapon.',
          'Make today better than yesterday.',
          'Small changes create big results.',
          'Your effort will never betray you.',
          'Now is the fastest time to start.',
        ];
    const dayIndex = new Date().getDate() % motivations.length;
    return motivations[dayIndex];
  }, [language]);

  const showHome = activeTab === null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-top-row">
          <button className="lang-toggle" onClick={toggleLanguage}>
            {language === 'ko' ? 'EN' : 'KO'}
          </button>
          <div className="header-actions">
            <button className="btn-settings" onClick={() => navigate('/settings')}>
              <span className="btn-settings-icon">&#9881;</span>
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              {t('auth.logout')}
            </button>
          </div>
        </div>

        <div className="hero-section">
          {userName && (
            <p className="hero-greeting">
              {t('home.welcome')}, {userName}
            </p>
          )}
          <h1 className="hero-title">{t('home.heroTitle')}</h1>
          <p className="hero-subtitle">{t('home.heroSubtitle')}</p>

          {showHome && (
            <button className="hero-cta" onClick={() => setActiveTab('upload')}>
              {t('home.startAnalysis')}
              <span className="hero-cta-arrow">&rarr;</span>
            </button>
          )}

          <div className="privacy-badge">
            <span className="privacy-icon">&#128274;</span> {t('security.localOnly')}
          </div>
        </div>
      </header>

      {showHome && (
        <>
          <div className="feature-cards">
            <div className="feature-card" onClick={() => setActiveTab('upload')}>
              <div className="feature-card-icon upload-icon">&#128247;</div>
              <div className="feature-card-title">{t('home.featureUpload')}</div>
              <div className="feature-card-desc">{t('home.featureUploadDesc')}</div>
            </div>
            <div className="feature-card" onClick={() => setActiveTab('analysis')}>
              <div className="feature-card-icon analysis-icon">&#129504;</div>
              <div className="feature-card-title">{t('home.featureAnalysis')}</div>
              <div className="feature-card-desc">{t('home.featureAnalysisDesc')}</div>
            </div>
            <div className="feature-card" onClick={() => setActiveTab('gallery')}>
              <div className="feature-card-icon trend-icon">&#128200;</div>
              <div className="feature-card-title">{t('home.featureTrend')}</div>
              <div className="feature-card-desc">{t('home.featureTrendDesc')}</div>
            </div>
          </div>

          <div className="motivation-section">
            <div className="motivation-label">{t('home.motivationTitle')}</div>
            <div className="motivation-text">&ldquo;{motivation}&rdquo;</div>
            <div className="motivation-deco">&#10024;</div>
          </div>
        </>
      )}

      {!showHome && (
        <>
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
            <button
              className="tab"
              onClick={() => setActiveTab(null)}
            >
              &#127968; {language === 'ko' ? '홈' : 'Home'}
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
        </>
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;
