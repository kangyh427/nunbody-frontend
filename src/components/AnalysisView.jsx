import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnalysisView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// 근육명 한글 매핑
const MUSCLE_NAMES = {
  shoulders: '어깨 (삼각근)',
  chest: '가슴 (대흉근)',
  back: '등 (광배근)',
  biceps: '이두근',
  triceps: '삼두근',
  abs: '복근 (복직근)',
  obliques: '옆구리 (외복사근)',
  quads: '앞허벅지 (대퇴사두)',
  hamstrings: '뒷허벅지 (햄스트링)',
  glutes: '엉덩이 (둔근)',
  calves: '종아리 (비복근)'
};

// 근육 카테고리
const MUSCLE_CATEGORIES = {
  upperBody: ['shoulders', 'chest', 'back', 'biceps', 'triceps'],
  core: ['abs', 'obliques'],
  lowerBody: ['quads', 'hamstrings', 'glutes', 'calves']
};

// 근육 데이터 안전하게 가져오기 (대소문자, 단수/복수 유연 처리)
const getMuscleData = (categoryData, muscleKey) => {
  if (!categoryData || typeof categoryData !== 'object') return null;
  
  // 정확한 키로 먼저 시도
  if (categoryData[muscleKey]) return categoryData[muscleKey];
  
  // 소문자 변환 후 시도
  const lowerKey = muscleKey.toLowerCase();
  const keys = Object.keys(categoryData);
  
  for (const key of keys) {
    // 대소문자 무시 비교
    if (key.toLowerCase() === lowerKey) return categoryData[key];
    // 단수/복수 변형 (shoulders -> shoulder, abs -> ab)
    if (key.toLowerCase() === lowerKey.replace(/s$/, '')) return categoryData[key];
    if (key.toLowerCase() + 's' === lowerKey) return categoryData[key];
  }
  
  return null;
};

const AnalysisView = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [comparePhoto, setComparePhoto] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('single');
  const [expandedMuscle, setExpandedMuscle] = useState(null);

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
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#8BC34A';
    if (score >= 4) return '#FFC107';
    return '#FF5722';
  };

  // 변화율에 따른 색상
  const getChangeColor = (changePercent) => {
    if (!changePercent) return '#9E9E9E';
    const num = parseFloat(changePercent);
    if (num > 0) return '#4CAF50';
    if (num < 0) return '#FF5722';
    return '#9E9E9E';
  };

  // 변화 점수에 따른 색상 (숫자용)
  const getScoreChangeColor = (score) => {
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

  // 근육 점수 안전하게 가져오기 (v2 호환)
  const getMuscleScore = (muscleData) => {
    if (typeof muscleData === 'number') return muscleData;
    if (typeof muscleData === 'object' && muscleData?.score) return muscleData.score;
    if (typeof muscleData === 'object' && muscleData?.overall) return muscleData.overall;
    return 5;
  };

  // 근육 상세 정보 안전하게 가져오기
  const getMuscleDetail = (muscleData) => {
    if (typeof muscleData === 'object' && muscleData?.detail) return muscleData.detail;
    return '';
  };

  return (
    <div className="analysis-container">
      {/* 모드 선택 - 탭 전환 시 기존 결과 유지 */}
      <div className="mode-selector">
        <button 
          className={mode === 'single' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => setMode('single')}
        >
          📷 단일 사진 분석
        </button>
        <button 
          className={mode === 'compare' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => setMode('compare')}
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
            <p className="loading-sub">12개 근육군을 정밀 분석 중 (약 10-15초)</p>
          </div>
        </div>
      )}

      {/* ==================== 단일 분석 결과 (v3.0) ==================== */}
      {analysisResult && (
        <div className="analysis-result">
          <h2>📊 AI 분석 결과</h2>
          
          {/* 전체 점수 */}
          <div className="score-card">
            <div 
              className="score-circle"
              style={{ borderColor: getScoreColor(analysisResult.overallScore / 10) }}
            >
              <span className="score-number">{analysisResult.overallScore || 70}</span>
              <span className="score-label">점</span>
            </div>
            <div className="score-info">
              <h3>{analysisResult.bodyType}</h3>
              <p>{analysisResult.bodyTypeDescription}</p>
            </div>
          </div>

          {/* 추정 신체 치수 */}
          {analysisResult.estimatedMeasurements && (
            <div className="result-section">
              <h3>📐 추정 신체 치수</h3>
              <div className="measurements-grid">
                <div className="measure-item">
                  <span className="label">어깨 너비</span>
                  <span className="value">{analysisResult.estimatedMeasurements.shoulderWidth}</span>
                </div>
                <div className="measure-item">
                  <span className="label">가슴 둘레</span>
                  <span className="value">{analysisResult.estimatedMeasurements.chestCircumference || '-'}</span>
                </div>
                <div className="measure-item">
                  <span className="label">허리 둘레</span>
                  <span className="value">{analysisResult.estimatedMeasurements.waistCircumference || analysisResult.estimatedMeasurements.waistEstimate}</span>
                </div>
                <div className="measure-item">
                  <span className="label">좌우 대칭</span>
                  <span className="value">{analysisResult.estimatedMeasurements.bodySymmetry}/10</span>
                </div>
              </div>
            </div>
          )}

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
                  <span className="label">머리 위치</span>
                  <span className="value">{analysisResult.posture.headPosition || '-'}</span>
                </div>
                <div className="posture-item">
                  <span className="label">자세 점수</span>
                  <span className="value highlight">{analysisResult.posture.score}점</span>
                </div>
              </div>
            </div>
          )}

          {/* 세부 근육 분석 (v3.0 신규) */}
          {analysisResult.muscleAnalysis && (
            <div className="result-section">
              <h3>💪 세부 근육 분석 (12개 근육군)</h3>
              
              {/* 상체 */}
              <div className="muscle-category">
                <h4>🏋️ 상체 (Upper Body) - 평균: {getMuscleScore(analysisResult.muscleAnalysis.upperBody)}/10</h4>
                <div className="muscle-detail-grid">
                  {analysisResult.muscleAnalysis.upperBody && typeof analysisResult.muscleAnalysis.upperBody === 'object' && 
                    MUSCLE_CATEGORIES.upperBody.map(muscle => {
                      const data = getMuscleData(analysisResult.muscleAnalysis.upperBody, muscle);
                      if (!data) return null;
                      const score = getMuscleScore(data);
                      return (
                        <div key={muscle} className="muscle-detail-item">
                          <div className="muscle-header">
                            <span className="muscle-name">{MUSCLE_NAMES[muscle]}</span>
                            <span className="muscle-score" style={{ color: getScoreColor(score) }}>
                              {score}/10
                            </span>
                          </div>
                          <div className="bar-container">
                            <div 
                              className="bar" 
                              style={{ 
                                width: `${score * 10}%`,
                                backgroundColor: getScoreColor(score)
                              }}
                            ></div>
                          </div>
                          {getMuscleDetail(data) && (
                            <p className="muscle-comment">{getMuscleDetail(data)}</p>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              </div>

              {/* 코어 */}
              <div className="muscle-category">
                <h4>🎯 코어 (Core) - 평균: {getMuscleScore(analysisResult.muscleAnalysis.core)}/10</h4>
                <div className="muscle-detail-grid">
                  {analysisResult.muscleAnalysis.core && typeof analysisResult.muscleAnalysis.core === 'object' &&
                    MUSCLE_CATEGORIES.core.map(muscle => {
                      const data = getMuscleData(analysisResult.muscleAnalysis.core, muscle);
                      if (!data) return null;
                      const score = getMuscleScore(data);
                      return (
                        <div key={muscle} className="muscle-detail-item">
                          <div className="muscle-header">
                            <span className="muscle-name">{MUSCLE_NAMES[muscle]}</span>
                            <span className="muscle-score" style={{ color: getScoreColor(score) }}>
                              {score}/10
                            </span>
                          </div>
                          <div className="bar-container">
                            <div 
                              className="bar" 
                              style={{ 
                                width: `${score * 10}%`,
                                backgroundColor: getScoreColor(score)
                              }}
                            ></div>
                          </div>
                          {getMuscleDetail(data) && (
                            <p className="muscle-comment">{getMuscleDetail(data)}</p>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              </div>

              {/* 하체 */}
              <div className="muscle-category">
                <h4>🦵 하체 (Lower Body) - 평균: {getMuscleScore(analysisResult.muscleAnalysis.lowerBody)}/10</h4>
                <div className="muscle-detail-grid">
                  {analysisResult.muscleAnalysis.lowerBody && typeof analysisResult.muscleAnalysis.lowerBody === 'object' &&
                    MUSCLE_CATEGORIES.lowerBody.map(muscle => {
                      const data = getMuscleData(analysisResult.muscleAnalysis.lowerBody, muscle);
                      if (!data) return null;
                      const score = getMuscleScore(data);
                      return (
                        <div key={muscle} className="muscle-detail-item">
                          <div className="muscle-header">
                            <span className="muscle-name">{MUSCLE_NAMES[muscle]}</span>
                            <span className="muscle-score" style={{ color: getScoreColor(score) }}>
                              {score}/10
                            </span>
                          </div>
                          <div className="bar-container">
                            <div 
                              className="bar" 
                              style={{ 
                                width: `${score * 10}%`,
                                backgroundColor: getScoreColor(score)
                              }}
                            ></div>
                          </div>
                          {getMuscleDetail(data) && (
                            <p className="muscle-comment">{getMuscleDetail(data)}</p>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          )}

          {/* 약한 근육 TOP 3 & 추천 운동 (v3.0 신규) */}
          {analysisResult.weakestMuscles && analysisResult.weakestMuscles.length > 0 && (
            <div className="result-section">
              <h3>🎯 집중 강화 필요 근육 TOP 3</h3>
              <div className="weak-muscles-list">
                {analysisResult.weakestMuscles.map((item, idx) => (
                  <div key={idx} className="weak-muscle-card">
                    <div 
                      className="weak-muscle-header"
                      onClick={() => setExpandedMuscle(expandedMuscle === idx ? null : idx)}
                    >
                      <div className="rank-badge">#{item.rank || idx + 1}</div>
                      <div className="weak-muscle-info">
                        <span className="muscle-name">{item.muscle}</span>
                        <span className="muscle-score-badge" style={{ backgroundColor: getScoreColor(item.score) }}>
                          {item.score}/10
                        </span>
                      </div>
                      <span className="expand-icon">{expandedMuscle === idx ? '▲' : '▼'}</span>
                    </div>
                    
                    {expandedMuscle === idx && (
                      <div className="weak-muscle-detail">
                        {item.reason && <p className="reason">💡 {item.reason}</p>}
                        <h5>추천 운동:</h5>
                        <div className="exercise-list">
                          {item.exercises?.map((ex, exIdx) => (
                            <div key={exIdx} className="exercise-item">
                              <span className="exercise-name">
                                {typeof ex === 'string' ? ex : ex.name}
                              </span>
                              {typeof ex === 'object' && (
                                <div className="exercise-detail">
                                  <span className="sets">{ex.sets}</span>
                                  <span className="reps">{ex.reps}</span>
                                  {ex.tip && <p className="tip">💡 {ex.tip}</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 강점 근육 */}
          {analysisResult.strongestMuscles && analysisResult.strongestMuscles.length > 0 && (
            <div className="result-section">
              <h3>💪 강점 근육</h3>
              <div className="strength-list">
                {analysisResult.strongestMuscles.map((item, idx) => (
                  <div key={idx} className="strength-item">
                    <span className="strength-name">✅ {item.muscle}</span>
                    <span className="strength-score" style={{ color: getScoreColor(item.score) }}>
                      {item.score}/10
                    </span>
                    {item.detail && <p className="strength-detail">{item.detail}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 주간 운동 계획 (v3.0 신규) */}
          {analysisResult.recommendations?.weeklyPlan && (
            <div className="result-section">
              <h3>📅 맞춤 주간 운동 계획</h3>
              <div className="weekly-plan">
                {Object.entries(analysisResult.recommendations.weeklyPlan).map(([day, plan]) => (
                  <div key={day} className="day-plan">
                    <span className="day-label">{day.toUpperCase()}</span>
                    <span className="day-content">{plan}</span>
                  </div>
                ))}
              </div>
              {analysisResult.recommendations.nutritionTip && (
                <p className="nutrition-tip">🥗 영양 팁: {analysisResult.recommendations.nutritionTip}</p>
              )}
              {analysisResult.recommendations.restTip && (
                <p className="rest-tip">😴 휴식 팁: {analysisResult.recommendations.restTip}</p>
              )}
            </div>
          )}

          {/* 요약 */}
          {analysisResult.summary && (
            <div className="summary-card">
              <h3>📝 종합 평가</h3>
              <p>{analysisResult.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== 비교 분석 결과 (v3.0) ==================== */}
      {comparisonResult && (
        <div className="comparison-result">
          <h2>🔄 변화 비교 분석 결과</h2>

          {/* 변화 점수 */}
          <div className="change-score-card">
            <div 
              className="change-indicator"
              style={{ backgroundColor: getScoreChangeColor(comparisonResult.changeScore) }}
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

          {/* Before/After 점수 비교 */}
          {(comparisonResult.beforeScore || comparisonResult.afterScore) && (
            <div className="result-section">
              <h3>📊 전후 점수 비교</h3>
              <div className="before-after-scores">
                <div className="ba-score before">
                  <span className="ba-label">Before</span>
                  <span className="ba-value">{comparisonResult.beforeScore || '-'}점</span>
                </div>
                <div className="ba-arrow">→</div>
                <div className="ba-score after">
                  <span className="ba-label">After</span>
                  <span className="ba-value">{comparisonResult.afterScore || '-'}점</span>
                </div>
              </div>
            </div>
          )}

          {/* 근육별 변화 상세 (v3.0 신규) */}
          {comparisonResult.muscleChanges && (
            <div className="result-section">
              <h3>💪 근육별 변화 상세</h3>
              <div className="muscle-changes-grid">
                {Object.entries(comparisonResult.muscleChanges).map(([muscle, data]) => {
                  if (!data || typeof data !== 'object') return null;
                  return (
                    <div key={muscle} className="muscle-change-card">
                      <div className="mc-header">
                        <span className="mc-name">{MUSCLE_NAMES[muscle] || muscle}</span>
                        <span 
                          className="mc-percent"
                          style={{ color: getChangeColor(data.changePercent) }}
                        >
                          {data.changePercent || '0%'}
                        </span>
                      </div>
                      <div className="mc-scores">
                        <span className="mc-before">{data.before || '-'}</span>
                        <span className="mc-arrow">→</span>
                        <span className="mc-after" style={{ color: getChangeColor(data.changePercent) }}>
                          {data.after || '-'}
                        </span>
                      </div>
                      {data.detail && <p className="mc-detail">{data.detail}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 가장 성장한 근육 TOP 3 (v3.0 신규) */}
          {comparisonResult.topImproved && comparisonResult.topImproved.length > 0 && (
            <div className="result-section">
              <h3>🏆 가장 성장한 근육 TOP 3</h3>
              <div className="top-improved-list">
                {comparisonResult.topImproved.map((item, idx) => (
                  <div key={idx} className="improved-card">
                    <div className="improved-rank">{['🥇', '🥈', '🥉'][idx] || `#${idx + 1}`}</div>
                    <div className="improved-info">
                      <span className="improved-muscle">{item.muscle}</span>
                      <span className="improved-percent" style={{ color: '#4CAF50' }}>
                        {item.changePercent}
                      </span>
                    </div>
                    {item.detail && <p className="improved-detail">{item.detail}</p>}
                    {item.keepDoingExercises && (
                      <div className="keep-doing">
                        <span className="keep-label">계속하면 좋은 운동:</span>
                        {item.keepDoingExercises.map((ex, exIdx) => (
                          <span key={exIdx} className="keep-exercise">{ex}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 더 노력 필요한 근육 (v3.0 신규) */}
          {comparisonResult.needsWork && comparisonResult.needsWork.length > 0 && (
            <div className="result-section">
              <h3>🎯 더 집중이 필요한 근육</h3>
              <div className="needs-work-list">
                {comparisonResult.needsWork.map((item, idx) => (
                  <div key={idx} className="needs-work-card">
                    <div className="nw-header">
                      <span className="nw-muscle">{item.muscle}</span>
                      <span className="nw-percent" style={{ color: getChangeColor(item.changePercent) }}>
                        {item.changePercent}
                      </span>
                    </div>
                    {item.reason && <p className="nw-reason">💡 {item.reason}</p>}
                    {item.recommendedExercises && (
                      <div className="nw-exercises">
                        <span className="nw-ex-label">추천 운동:</span>
                        {item.recommendedExercises.map((ex, exIdx) => (
                          <div key={exIdx} className="nw-exercise">
                            <span className="ex-name">{typeof ex === 'string' ? ex : ex.name}</span>
                            {typeof ex === 'object' && (
                              <span className="ex-detail">{ex.sets} × {ex.reps}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 체성분 변화 */}
          {comparisonResult.bodyComposition && (
            <div className="result-section">
              <h3>⚖️ 체성분 변화</h3>
              <div className="body-comp-grid">
                <div className="comp-item">
                  <span className="comp-label">체지방</span>
                  <span className="comp-value">{comparisonResult.bodyComposition.fatChange}</span>
                </div>
                <div className="comp-item">
                  <span className="comp-label">근육량</span>
                  <span className="comp-value">{comparisonResult.bodyComposition.muscleChange}</span>
                </div>
              </div>
              {comparisonResult.bodyComposition.detail && (
                <p className="comp-detail">{comparisonResult.bodyComposition.detail}</p>
              )}
            </div>
          )}

          {/* 격려 메시지 */}
          {comparisonResult.encouragement && (
            <div className="encouragement-card">
              <p>💪 {comparisonResult.encouragement}</p>
            </div>
          )}

          {/* 다음 목표 & 주간 계획 */}
          {comparisonResult.recommendations && (
            <div className="result-section">
              <h3>🎯 다음 단계 추천</h3>
              {comparisonResult.recommendations.nextGoal && (
                <p className="next-goal">🏁 다음 목표: {comparisonResult.recommendations.nextGoal}</p>
              )}
              {comparisonResult.recommendations.focusMuscles && (
                <div className="focus-muscles">
                  <span className="focus-label">집중 근육:</span>
                  {comparisonResult.recommendations.focusMuscles.map((m, idx) => (
                    <span key={idx} className="focus-tag">{m}</span>
                  ))}
                </div>
              )}
              {comparisonResult.recommendations.weeklyPlan && (
                <div className="weekly-plan">
                  {Object.entries(comparisonResult.recommendations.weeklyPlan).map(([day, plan]) => (
                    <div key={day} className="day-plan">
                      <span className="day-label">{day}</span>
                      <span className="day-content">{plan}</span>
                    </div>
                  ))}
                </div>
              )}
              {comparisonResult.recommendations.nutritionTip && (
                <p className="nutrition-tip">🥗 {comparisonResult.recommendations.nutritionTip}</p>
              )}
              {comparisonResult.recommendations.lifestyleTip && (
                <p className="lifestyle-tip">🌟 {comparisonResult.recommendations.lifestyleTip}</p>
              )}
            </div>
          )}

          {/* 요약 */}
          {comparisonResult.summary && (
            <div className="summary-card">
              <h3>📝 분석 요약</h3>
              <p>{comparisonResult.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
