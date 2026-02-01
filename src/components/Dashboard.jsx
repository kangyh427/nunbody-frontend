import React, { useState } from 'react';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshGallery, setRefreshGallery] = useState(0);

  const handleUploadSuccess = () => {
    setActiveTab('gallery');
    setRefreshGallery(prev => prev + 1); // 갤러리 새로고침
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>👁️ 눈바디 (NunBody)</h1>
        <p>AI로 분석하는 나의 몸 변화</p>
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
          disabled
        >
          📊 변화 분석 (준비중)
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
          <div className="coming-soon">
            <h2>🚧 AI 변화 분석 기능</h2>
            <p>곧 출시됩니다!</p>
            <ul>
              <li>✅ 이전 사진과 비교</li>
              <li>✅ 근육량/지방량 변화 추정</li>
              <li>✅ 부위별 변화 측정</li>
              <li>✅ 개인 맞춤 운동 조언</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
