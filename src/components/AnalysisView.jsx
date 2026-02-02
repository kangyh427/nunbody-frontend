import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnalysisView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const AnalysisView = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [comparePhoto, setComparePhoto] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('single'); // 'single' or 'compare'

  // 사진 목록 로드
  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/photos/my-photos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPhotos(response.data.photos);
      }
    } catch (err) {
      console.error('사진 로드 실패:', err);
    }
  };

  // 단일 사진 분석
  const handleAnalyze = async () => {
    if (!selectedPhoto) {
      setError('분석할 사진을 선택해주세요');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/analysis/analyze`,
        { photoId: selectedPhoto.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAnalysisResult(response.data.analysis);
      }
    } catch (err) {
      console.error('분석 실패:', err);
      setError(err.response?.data?.error || '분석 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 두 사진 비교 분석
  const handleCompare = async () => {
    if (!selectedPhoto || !comparePhoto) {
      setError('비교할 사진 2장을 선택해주세요');
      return;
    }

    if (selectedPhoto.id === comparePhoto.id) {
      setError('서로 다른 사진을 선택해주세요');
      return;
    }

    setLoading(true);
    setError('');
    setComparisonResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/analysis/compare`,
        { 
          photoId1: selectedPhoto.id, 
          photoId2: comparePhoto.id 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setComparisonResult(response.data.comparison);
      }
    } catch (err) {
      console.error('비교 분석 실패:', err);
      setError(err.response?.data?.error || '비교 분석 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 점수에 따른 색상
  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    return '#FF5722';
  };

  // 변화 점수에 따른 색상
  const getChangeColor = (score) => {
    if (score > 0) return '#4CAF50';
    if (score < 0) return '#FF5722';
    return '#9E9E9E';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="analysis-container">
      {/* 모드 선택 */}
      <div className="mode-selector">
        <button 
          className={mode === 'single' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => { setMode('single'); setComparisonResult(null); }}
        >
          📷 단일 사진 분석
        </button>
        <button 
          className={mode === 'compare' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => { setMode('compare'); setAnalysisResult(null); }}
        >
          🔄 사진 비교 분석
        </button>
      </div>

      {/* 사진 선택 영역 */}
      <div className="photo-selection">
        {mode === 'single' ? (
          <div className="single-select">
            <h3>📸 분석할 사진 선택</h3>
            <div className="photo-grid">
              {photos.map(photo => (
                <div 
                  key={photo.id}
                  className={`photo-item ${selectedPhoto?.id === photo.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img src={photo.photo_url} alt="body" />
                  <span className="photo-date">{formatDate(photo.taken_at)}</span>
                  {selectedPhoto?.id === photo.id && <div className="selected-badge">✓</div>}
                </div>
              ))}
            </div>
            {photos.length === 0 && (
              <p className="no-photos">사진이 없습니다. 먼저 사진을 업로드해주세요.</p>
            )}
          </div>
        ) : (
          <div className="compare-select">
            <div className="compare-column">
              <h3>📅 이전 사진 (Before)</h3>
              <div className="photo-grid">
                {photos.map(photo => (
                  <div 
                    key={photo.id}
                    className={`photo-item ${selectedPhoto?.id === photo.id ? 'selected before' : ''}`}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img src={photo.photo_url} alt="before" />
                    <span className="photo-date">{formatDate(photo.taken_at)}</span>
                    {selectedPhoto?.id === photo.id && <div className="selected-badge before">이전</div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="compare-column">
              <h3>📅 이후 사진 (After)</h3>
              <div className="photo-grid">
                {photos.map(photo => (
                  <div 
                    key={photo.id}
                    className={`photo-item ${comparePhoto?.id === photo.id ? 'selected after' : ''}`}
                    onClick={() => setComparePhoto(photo)}
                  >
                    <img src={photo.photo_url} alt="after" />
                    <span className="photo-date">{formatDate(photo.taken_at)}</span>
                    {comparePhoto?.id === photo.id && <div className="selected-badge after">이후</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && <div className="error-message">{error}</div>}

      {/* 분석 버튼 */}
      <div className="action-buttons">
        {mode === 'single' ? (
          <button 
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || !selectedPhoto}
          >
            {loading ? '🔄 AI 분석 중...' : '🤖 AI 분석 시작'}
          </button>
        ) : (
          <button 
            className="analyze-btn compare"
            onClick={handleCompare}
            disabled={loading || !selectedPhoto || !comparePhoto}
          >
            {loading ? '🔄 비교 분석 중...' : '🔄 변화 비교 분석'}
          </button>
        )}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>🤖 AI가 사진을 분석하고 있습니다...</p>
            <p className="loading-sub">잠시만 기다려주세요 (약 5-10초)</p>
          </div>
        </div>
      )}

      {/* 단일 분석 결과 */}
      {analysisResult && (
        <div className="analysis-result">
          <h2>📊 AI 분석 결과</h2>
          
          {/* 전체 점수 */}
          <div className="score-card">
            <div 
              className="score-circle"
              style={{ borderColor: getScoreColor(analysisResult.overallScore) }}
            >
              <span className="score-number">{analysisResult.overallScore}</span>
              <span className="score-label">점</span>
            </div>
            <div className="score-info">
              <h3>{analysisResult.bodyType}</h3>
              <p>{analysisResult.bodyTypeDescription || analysisResult.summary}</p>
            </div>
          </div>

          {/* 자세 분석 */}
          {analysisResult.posture && (
            <div className="result-section">
              <h3>🧘 자세 분석</h3>
              <div className="posture-grid">
                <div className="posture-item">
                  <span className="label">척추 정렬</span>
                  <span className="value">{analysisResult.posture.spineAlignment}</span>
                </div>
                <div className="posture-item">
                  <span className="label">어깨 균형</span>
                  <span className="value">{analysisResult.posture.shoulderBalance}</span>
                </div>
                <div className="posture-item">
                  <span className="label">자세 점수</span>
                  <span className="value">{analysisResult.posture.score}점</span>
                </div>
              </div>
            </div>
          )}

          {/* 근육 분석 */}
          {analysisResult.muscleAnalysis && (
            <div className="result-section">
              <h3>💪 근육 분석</h3>
              <div className="muscle-bars">
                <div className="muscle-item">
                  <span className="label">상체</span>
                  <div className="bar-container">
                    <div 
                      className="bar" 
                      style={{ width: `${analysisResult.muscleAnalysis.upperBody * 10}%` }}
                    ></div>
                  </div>
                  <span className="value">{analysisResult.muscleAnalysis.upperBody}/10</span>
                </div>
                <div className="muscle-item">
                  <span className="label">코어</span>
                  <div className="bar-container">
                    <div 
                      className="bar" 
                      style={{ width: `${analysisResult.muscleAnalysis.core * 10}%` }}
                    ></div>
                  </div>
                  <span className="value">{analysisResult.muscleAnalysis.core}/10</span>
                </div>
                <div className="muscle-item">
                  <span className="label">하체</span>
                  <div className="bar-container">
                    <div 
                      className="bar" 
                      style={{ width: `${analysisResult.muscleAnalysis.lowerBody * 10}%` }}
                    ></div>
                  </div>
                  <span className="value">{analysisResult.muscleAnalysis.lowerBody}/10</span>
                </div>
              </div>
            </div>
          )}

          {/* 강점 & 개선점 */}
          <div className="result-section two-column">
            <div className="column">
              <h3>✨ 강점</h3>
              <ul className="list strengths">
                {analysisResult.strengths?.map((item, idx) => (
                  <li key={idx}>✅ {item}</li>
                ))}
              </ul>
            </div>
            <div className="column">
              <h3>🎯 개선점</h3>
              <ul className="list improvements">
                {analysisResult.improvements?.map((item, idx) => (
                  <li key={idx}>💡 {item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 추천 운동 */}
          {analysisResult.recommendations && (
            <div className="result-section">
              <h3>🏋️ 추천 운동</h3>
              <div className="recommendations">
                {(analysisResult.recommendations.exercises || analysisResult.recommendations)?.map((ex, idx) => (
                  <span key={idx} className="rec-tag">{ex}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 비교 분석 결과 */}
      {comparisonResult && (
        <div className="comparison-result">
          <h2>🔄 변화 비교 분석 결과</h2>

          {/* 변화 점수 */}
          <div className="change-score-card">
            <div 
              className="change-indicator"
              style={{ backgroundColor: getChangeColor(comparisonResult.changeScore) }}
            >
              <span className="change-number">
                {comparisonResult.changeScore > 0 ? '+' : ''}{comparisonResult.changeScore}
              </span>
            </div>
            <div className="change-info">
              <h3>{comparisonResult.overallChange}</h3>
              <p>{comparisonResult.periodAnalysis}</p>
            </div>
          </div>

          {/* 상세 변화 */}
          {comparisonResult.detailedChanges && (
            <div className="result-section">
              <h3>📈 부위별 변화</h3>
              <div className="changes-grid">
                <div className="change-item">
                  <span className="label">체중</span>
                  <span className="value">{comparisonResult.detailedChanges.weight?.direction}</span>
                </div>
                <div className="change-item">
                  <span className="label">상체</span>
                  <span 
                    className="value"
                    style={{ color: getChangeColor(comparisonResult.detailedChanges.upperBody?.score || 0) }}
                  >
                    {comparisonResult.detailedChanges.upperBody?.score > 0 ? '↑' : 
                     comparisonResult.detailedChanges.upperBody?.score < 0 ? '↓' : '→'}
                  </span>
                </div>
                <div className="change-item">
                  <span className="label">코어</span>
                  <span 
                    className="value"
                    style={{ color: getChangeColor(comparisonResult.detailedChanges.core?.score || 0) }}
                  >
                    {comparisonResult.detailedChanges.core?.score > 0 ? '↑' : 
                     comparisonResult.detailedChanges.core?.score < 0 ? '↓' : '→'}
                  </span>
                </div>
                <div className="change-item">
                  <span className="label">하체</span>
                  <span 
                    className="value"
                    style={{ color: getChangeColor(comparisonResult.detailedChanges.lowerBody?.score || 0) }}
                  >
                    {comparisonResult.detailedChanges.lowerBody?.score > 0 ? '↑' : 
                     comparisonResult.detailedChanges.lowerBody?.score < 0 ? '↓' : '→'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 긍정적 변화 */}
          <div className="result-section">
            <h3>🎉 긍정적 변화</h3>
            <ul className="list positive">
              {comparisonResult.positiveChanges?.map((item, idx) => (
                <li key={idx}>✨ {item}</li>
              ))}
            </ul>
          </div>

          {/* 격려 메시지 */}
          <div className="encouragement-card">
            <p>💪 {comparisonResult.encouragement}</p>
          </div>

          {/* 추천사항 */}
          {comparisonResult.recommendations && (
            <div className="result-section">
              <h3>💡 추천사항</h3>
              <div className="rec-list">
                {comparisonResult.recommendations.exercises?.map((ex, idx) => (
                  <span key={idx} className="rec-tag exercise">{ex}</span>
                ))}
              </div>
              {comparisonResult.recommendations.nutrition && (
                <p className="rec-text">🥗 {comparisonResult.recommendations.nutrition}</p>
              )}
            </div>
          )}

          {/* 요약 */}
          <div className="summary-card">
            <h3>📝 분석 요약</h3>
            <p>{comparisonResult.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
