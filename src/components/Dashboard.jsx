import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';
import AnalysisView from './AnalysisView';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshGallery, setRefreshGallery] = useState(0);

  const handleUploadSuccess = () => {
    setActiveTab('gallery');
    setRefreshGallery(prev => prev + 1); // 갤러리 새로고침
  };

  // 로그아웃 처리
  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>👁️ 눈바디 (NunBody)</h1>
        <p>AI로 분석하는 나의 몸 변화</p>
        <button className="btn-logout" onClick={handleLogout}>
          로그아웃
        </button>
      </header>

      <nav className="dashboard-tabs">
        <button 
          className={activeTab === 'upload' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('upload')}
        >
          📸 사진 촬영
        </button>
        <button 
          className={activeTab === 'gallery' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('gallery')}
        >
          📂 내 사진
        </button>
        <button 
          className={activeTab === 'analysis' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('analysis')}
        >
          📊 AI 분석
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
