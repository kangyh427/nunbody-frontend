import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnalysisView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const MUSCLE_NAMES = {
  shoulders: '어깨', chest: '가슴', back: '등', biceps: '이두', triceps: '삼두',
  abs: '복근', obliques: '옆구리', quads: '앞허벅지', hamstrings: '뒷허벅지', glutes: '엉덩이', calves: '종아리'
};

const MUSCLE_CATEGORIES = {
  upperBody: ['shoulders', 'chest', 'back', 'biceps', 'triceps'],
  core: ['abs', 'obliques'],
  lowerBody: ['quads', 'hamstrings', 'glutes', 'calves']
};

const CONDITION_LABELS = {
  muscleState: { flexed: '💪 힘줌', relaxed: '😌 이완', unknown: '❓ 불명' },
  lighting: { strong: '☀️ 강함', moderate: '🌤️ 보통', weak: '🌙 약함' },
  distance: { close: '🔍 근접', medium: '📷 중거리', far: '🏔️ 원거리' }
};

const ConfidenceBadge = ({ level }) => {
  const cfg = { high: { l: '높음', c: '#4CAF50', b: '#E8F5E9' }, medium: { l: '보통', c: '#FF9800', b: '#FFF3E0' }, low: { l: '낮음', c: '#F44336', b: '#FFEBEE' }, none: { l: '불가', c: '#9E9E9E', b: '#F5F5F5' } };
  const c = cfg[level] || cfg.none;
  return <span className="confidence-badge" style={{ color: c.c, backgroundColor: c.b }}>{c.l}</span>;
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
  const [userProfile, setUserProfile] = useState({ height_cm: '', weight_kg: '', age: '', gender: '' });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  
  // v4.2: 히스토리 관련 state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);

  useEffect(() => { fetchPhotos(); fetchUserProfile(); }, []);
  
  // v4.2: 히스토리 모드 진입 시 데이터 로드
  useEffect(() => {
    if (mode === 'history') {
      fetchHistory();
    }
  }, [mode]);

  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/photos/my-photos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setPhotos(res.data.photos);
    } catch (err) { console.error(err); }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/analysis/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success && res.data.profile) {
        setUserProfile({ height_cm: res.data.profile.height_cm || '', weight_kg: res.data.profile.weight_kg || '', age: res.data.profile.age || '', gender: res.data.profile.gender || '' });
      }
    } catch (err) { console.error(err); }
  };

  // v4.2: 히스토리 목록 조회
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/analysis/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (err) { console.error(err); }
    finally { setHistoryLoading(false); }
  };

  // v4.2: 히스토리 상세 조회
  const fetchHistoryDetail = async (historyId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/analysis/history/${historyId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setSelectedHistory(res.data.history);
        setShowHistoryDetail(true);
        
        // 분석 타입에 따라 결과 설정
        if (res.data.history.analysisType === 'single') {
          setAnalysisResult(res.data.history.result);
          setComparisonResult(null);
        } else {
          setComparisonResult(res.data.history.result);
          setAnalysisResult(null);
        }
      }
    } catch (err) { console.error(err); setError('히스토리를 불러올 수 없습니다'); }
    finally { setLoading(false); }
  };

  const saveUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/analysis/profile`, {
        height_cm: userProfile.height_cm ? parseFloat(userProfile.height_cm) : null,
        weight_kg: userProfile.weight_kg ? parseFloat(userProfile.weight_kg) : null,
        age: userProfile.age ? parseInt(userProfile.age) : null,
        gender: userProfile.gender || null
      }, { headers: { Authorization: `Bearer ${token}` } });
      setProfileSaved(true); setShowProfileModal(false);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) { console.error(err); }
  };

  const handleAnalyze = async () => {
    if (!selectedPhoto) { setError('사진을 선택해주세요'); return; }
    setLoading(true); setError(''); setAnalysisResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/analysis/analyze`, { photoId: selectedPhoto.id }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setAnalysisResult(res.data.analysis);
    } catch (err) { setError(err.response?.data?.error || '분석 오류'); }
    finally { setLoading(false); }
  };

  const handleCompare = async () => {
    if (!selectedPhoto || !comparePhoto) { setError('2장 선택해주세요'); return; }
    if (selectedPhoto.id === comparePhoto.id) { setError('다른 사진을 선택해주세요'); return; }
    setLoading(true); setError(''); setComparisonResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/analysis/compare`, { photoId1: selectedPhoto.id, photoId2: comparePhoto.id }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setComparisonResult(res.data.comparison);
    } catch (err) { setError(err.response?.data?.error || '비교 오류'); }
    finally { setLoading(false); }
  };

  const getScoreColor = (s) => s === null ? '#9E9E9E' : s >= 8 ? '#4CAF50' : s >= 6 ? '#8BC34A' : s >= 4 ? '#FFC107' : '#FF5722';
  const getChangeColor = (c) => { if (!c || c === '비교불가') return '#9E9E9E'; const n = parseFloat(c); return isNaN(n) ? '#9E9E9E' : n > 0 ? '#4CAF50' : n < 0 ? '#FF5722' : '#9E9E9E'; };
  const formatDate = (d) => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatDateTime = (d) => new Date(d).toLocaleString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getMuscleScore = (d) => d === null ? null : typeof d === 'number' ? d : d?.score ?? null;
  const getMuscleData = (cat, key) => cat?.[key] || null;

  const renderMuscle = (muscle, data) => {
    if (!data) return null;
    const score = getMuscleScore(data);
    const conf = data?.confidence || 'none';
    const visible = data?.visibleInPhoto !== false;
    return (
      <div key={muscle} className={`muscle-item ${!visible ? 'not-visible' : ''}`}>
        <div className="muscle-row">
          <span className="muscle-name">{MUSCLE_NAMES[muscle]}</span>
          <div className="muscle-score-area">
            {score !== null ? <span className="muscle-score" style={{ color: getScoreColor(score) }}>{score}/10</span> : <span className="muscle-score na">N/A</span>}
            <ConfidenceBadge level={conf} />
          </div>
        </div>
        {score !== null && <div className="bar-wrap"><div className="bar" style={{ width: `${score * 10}%`, backgroundColor: getScoreColor(score) }}></div></div>}
        {data?.detail && <p className="muscle-detail">{data.detail}</p>}
      </div>
    );
  };

  // v4.2: 히스토리 아이템 렌더링
  const renderHistoryItem = (item) => {
    const isCompare = item.analysis_type === 'compare';
    const photoList = item.photos || [];
    
    return (
      <div 
        key={item.id} 
        className="history-item"
        onClick={() => fetchHistoryDetail(item.id)}
      >
        <div className="history-photos">
          {photoList.slice(0, 2).map((p, idx) => (
            <img key={idx} src={p.url} alt="" className="history-thumb" />
          ))}
        </div>
        <div className="history-info">
          <div className="history-type">
            {isCompare ? '🔄 비교 분석' : '📷 단일 분석'}
          </div>
          <div className="history-date">{formatDateTime(item.created_at)}</div>
          <div className="history-score">
            {item.overall_score && (
              <span className="score-badge" style={{ backgroundColor: getScoreColor(item.overall_score / 10) }}>
                {item.overall_score}점
              </span>
            )}
            {item.body_fat_percent && (
              <span className="bf-badge">체지방 {item.body_fat_percent}%</span>
            )}
          </div>
        </div>
        <div className="history-arrow">›</div>
      </div>
    );
  };

  return (
    <div className="analysis-container">
      {/* 프로필 설정 */}
      <div className="profile-section">
        <button className="profile-btn" onClick={() => setShowProfileModal(true)}>
          ⚙️ 신체정보 {userProfile.height_cm ? '✓' : ''}
        </button>
        {profileSaved && <span className="saved-msg">✓ 저장됨</span>}
        {userProfile.height_cm && <span className="profile-info">{userProfile.height_cm}cm/{userProfile.weight_kg}kg</span>}
      </div>

      {/* 프로필 모달 */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📏 신체 정보 입력</h3>
            <p className="modal-desc">정확한 분석을 위해 입력해주세요.</p>
            <div className="form-row">
              <div className="form-group"><label>키(cm)</label><input type="number" placeholder="175" value={userProfile.height_cm} onChange={(e) => setUserProfile({...userProfile, height_cm: e.target.value})} /></div>
              <div className="form-group"><label>몸무게(kg)</label><input type="number" placeholder="70" value={userProfile.weight_kg} onChange={(e) => setUserProfile({...userProfile, weight_kg: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>나이</label><input type="number" placeholder="30" value={userProfile.age} onChange={(e) => setUserProfile({...userProfile, age: e.target.value})} /></div>
              <div className="form-group">
                <label>성별</label>
                <select value={userProfile.gender} onChange={(e) => setUserProfile({...userProfile, gender: e.target.value})}>
                  <option value="">선택</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setShowProfileModal(false)}>취소</button>
              <button className="btn-save" onClick={saveUserProfile}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* v4.2: 모드 선택 (히스토리 탭 추가) */}
      <div className="mode-selector">
        <button className={`mode-btn ${mode === 'single' ? 'active' : ''}`} onClick={() => { setMode('single'); setComparisonResult(null); setShowHistoryDetail(false); }}>📷 단일 분석</button>
        <button className={`mode-btn ${mode === 'compare' ? 'active' : ''}`} onClick={() => { setMode('compare'); setAnalysisResult(null); setShowHistoryDetail(false); }}>🔄 비교 분석</button>
        <button className={`mode-btn ${mode === 'history' ? 'active' : ''}`} onClick={() => { setMode('history'); setAnalysisResult(null); setComparisonResult(null); setShowHistoryDetail(false); }}>📊 분석 기록</button>
      </div>

      {/* v4.2: 히스토리 모드 */}
      {mode === 'history' && !showHistoryDetail && (
        <div className="history-section">
          <h3>📊 분석 기록</h3>
          {historyLoading ? (
            <div className="history-loading">불러오는 중...</div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <p>아직 분석 기록이 없습니다.</p>
              <p>사진을 분석하면 여기에 기록이 저장됩니다.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map(item => renderHistoryItem(item))}
            </div>
          )}
        </div>
      )}

      {/* v4.2: 히스토리 상세 보기 헤더 */}
      {showHistoryDetail && selectedHistory && (
        <div className="history-detail-header">
          <button className="back-btn" onClick={() => { setShowHistoryDetail(false); setAnalysisResult(null); setComparisonResult(null); }}>
            ← 목록으로
          </button>
          <span className="history-detail-date">{formatDateTime(selectedHistory.createdAt)}</span>
        </div>
      )}

      {/* 사진 선택 (단일/비교 모드에서만) */}
      {mode === 'single' && !showHistoryDetail && (
        <div className="photo-selection">
          <h3>분석할 사진 선택</h3>
          {photos.length === 0 ? <p className="no-photos">사진이 없습니다. 먼저 사진을 업로드해주세요.</p> : (
            <div className="photo-grid">
              {photos.map(p => (
                <div key={p.id} className={`photo-item ${selectedPhoto?.id === p.id ? 'selected' : ''}`} onClick={() => setSelectedPhoto(p)}>
                  <img src={p.photo_url} alt="" />
                  <span className="photo-date">{formatDate(p.taken_at)}</span>
                  {selectedPhoto?.id === p.id && <span className="selected-badge">선택</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'compare' && !showHistoryDetail && (
        <div className="photo-selection">
          <div className="compare-select">
            <div className="compare-col">
              <h3>📅 Before (이전)</h3>
              <div className="photo-grid">
                {photos.map(p => (
                  <div key={p.id} className={`photo-item ${selectedPhoto?.id === p.id ? 'selected before' : ''}`} onClick={() => setSelectedPhoto(p)}>
                    <img src={p.photo_url} alt="" />
                    <span className="photo-date">{formatDate(p.taken_at)}</span>
                    {selectedPhoto?.id === p.id && <span className="selected-badge before">Before</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="compare-col">
              <h3>📅 After (이후)</h3>
              <div className="photo-grid">
                {photos.map(p => (
                  <div key={p.id} className={`photo-item ${comparePhoto?.id === p.id ? 'selected after' : ''}`} onClick={() => setComparePhoto(p)}>
                    <img src={p.photo_url} alt="" />
                    <span className="photo-date">{formatDate(p.taken_at)}</span>
                    {comparePhoto?.id === p.id && <span className="selected-badge after">After</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {/* 분석 버튼 (히스토리 모드가 아닐 때만) */}
      {mode !== 'history' && !showHistoryDetail && (
        <div className="action-btns">
          {mode === 'single' ? (
            <button className="analyze-btn" onClick={handleAnalyze} disabled={!selectedPhoto || loading}>
              {loading ? '분석 중...' : '🔬 AI 정밀 분석'}
            </button>
          ) : (
            <button className="analyze-btn compare" onClick={handleCompare} disabled={!selectedPhoto || !comparePhoto || loading}>
              {loading ? '비교 중...' : '🔄 변화 정밀 비교'}
            </button>
          )}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner"></div>
            <p>{mode === 'single' ? 'AI가 분석 중입니다...' : 'AI가 변화를 비교 중입니다...'}</p>
            <p className="loading-sub">약 10-20초 소요</p>
          </div>
        </div>
      )}

      {/* ===== 단일 분석 결과 ===== */}
      {analysisResult && (
        <div className="analysis-result">
          <h2>📊 분석 결과 <span className="ver">v{analysisResult.analysisVersion || '4.2'}</span></h2>

          {/* 사진 조건 */}
          {analysisResult.photoConditions && (
            <div className="section conditions">
              <h3>📷 사진 조건</h3>
              <div className="cond-grid">
                <div className="cond-item"><span className="cond-label">근육 상태</span><span>{CONDITION_LABELS.muscleState[analysisResult.photoConditions.muscleState] || analysisResult.photoConditions.muscleState}</span></div>
                <div className="cond-item"><span className="cond-label">조명</span><span>{CONDITION_LABELS.lighting[analysisResult.photoConditions.lighting] || analysisResult.photoConditions.lighting}</span></div>
                <div className="cond-item"><span className="cond-label">거리</span><span>{CONDITION_LABELS.distance[analysisResult.photoConditions.distance] || analysisResult.photoConditions.distance}</span></div>
                <div className="cond-item"><span className="cond-label">신뢰도</span><ConfidenceBadge level={analysisResult.photoConditions.analysisReliability} /></div>
              </div>
              {analysisResult.photoConditions.analysisLimitations && <div className="limit-note">⚠️ {analysisResult.photoConditions.analysisLimitations}</div>}
            </div>
          )}

          {/* 축척 보정 */}
          {analysisResult.spatialCalibration && (
            <div className="section calibration">
              <h3>📐 축척 보정</h3>
              <div className="cal-grid">
                <span>기준: {analysisResult.spatialCalibration.primaryAnchor}</span>
                <ConfidenceBadge level={analysisResult.spatialCalibration.calibrationConfidence} />
              </div>
            </div>
          )}

          {/* 전체 점수 */}
          <div className="score-card">
            <div className="score-circle">
              <span className="score-num">{analysisResult.overallScore || '-'}</span>
              <span className="score-label">/100</span>
            </div>
            <div className="score-info">
              <h3>{analysisResult.bodyType} <ConfidenceBadge level={analysisResult.overallConfidence} /></h3>
              <p>{analysisResult.bodyTypeDescription}</p>
              {analysisResult.estimatedBodyFatPercent && (
                <p className="bf-est">체지방률 추정: ~{analysisResult.estimatedBodyFatPercent}% <ConfidenceBadge level={analysisResult.bodyFatConfidence} /></p>
              )}
            </div>
          </div>

          {/* 질감 분석 */}
          {analysisResult.textureAnalysis && (
            <div className="section texture">
              <h3>🔬 질감 분석</h3>
              <div className="tex-grid">
                <div className="tex-item"><span>데피니션</span><span>{analysisResult.textureAnalysis.overallDefinition}/10</span></div>
                <div className="tex-item"><span>혈관비침</span><span>{analysisResult.textureAnalysis.vascularity}</span></div>
                <div className="tex-item"><span>피하지방</span><span>{analysisResult.textureAnalysis.skinFoldEstimate}</span></div>
              </div>
            </div>
          )}

          {/* 측정치 */}
          {analysisResult.estimatedMeasurements && (
            <div className="section measurements">
              <h3>📏 추정 측정치</h3>
              <div className="meas-grid">
                {analysisResult.estimatedMeasurements.shoulderWidth && <div className="meas-item"><span>어깨</span><span>{analysisResult.estimatedMeasurements.shoulderWidth}</span></div>}
                {analysisResult.estimatedMeasurements.chestCircumference && <div className="meas-item"><span>가슴</span><span>{analysisResult.estimatedMeasurements.chestCircumference}</span></div>}
                {analysisResult.estimatedMeasurements.waistCircumference && <div className="meas-item"><span>허리</span><span>{analysisResult.estimatedMeasurements.waistCircumference}</span></div>}
                {analysisResult.estimatedMeasurements.armCircumference && <div className="meas-item"><span>팔</span><span>{analysisResult.estimatedMeasurements.armCircumference}</span></div>}
                {analysisResult.estimatedMeasurements.thighCircumference && <div className="meas-item"><span>허벅지</span><span>{analysisResult.estimatedMeasurements.thighCircumference}</span></div>}
              </div>
            </div>
          )}

          {/* 근육 분석 */}
          {analysisResult.muscleAnalysis && (
            <div className="section muscles">
              <h3>💪 근육별 분석</h3>
              {analysisResult.muscleAnalysis.upperBody && (
                <div className="muscle-category">
                  <h4>상체 (전체: {analysisResult.muscleAnalysis.upperBody.overall || '-'}/10)</h4>
                  <div className="muscle-list">
                    {MUSCLE_CATEGORIES.upperBody.map(m => renderMuscle(m, getMuscleData(analysisResult.muscleAnalysis.upperBody, m)))}
                  </div>
                </div>
              )}
              {analysisResult.muscleAnalysis.core && (
                <div className="muscle-category">
                  <h4>코어 (전체: {analysisResult.muscleAnalysis.core.overall || '-'}/10)</h4>
                  <div className="muscle-list">
                    {MUSCLE_CATEGORIES.core.map(m => renderMuscle(m, getMuscleData(analysisResult.muscleAnalysis.core, m)))}
                  </div>
                </div>
              )}
              {analysisResult.muscleAnalysis.lowerBody && (
                <div className="muscle-category">
                  <h4>하체 (전체: {analysisResult.muscleAnalysis.lowerBody.overall || '-'}/10)</h4>
                  <div className="muscle-list">
                    {MUSCLE_CATEGORIES.lowerBody.map(m => renderMuscle(m, getMuscleData(analysisResult.muscleAnalysis.lowerBody, m)))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 약점 */}
          {analysisResult.weakestMuscles?.length > 0 && (
            <div className="section weak-points">
              <h3>⚠️ 개선 필요</h3>
              {analysisResult.weakestMuscles.map((wp, idx) => (
                <div key={idx} className="weak-card">
                  <div className="weak-header" onClick={() => setExpandedMuscle(expandedMuscle === idx ? null : idx)}>
                    <span className="rank">{idx + 1}</span>
                    <span className="name">{wp.muscle}</span>
                    <span className="score" style={{ backgroundColor: getScoreColor(wp.score) }}>{wp.score}/10</span>
                    <span className="expand">{expandedMuscle === idx ? '▲' : '▼'}</span>
                  </div>
                  {expandedMuscle === idx && (
                    <div className="weak-detail">
                      <p className="reason">{wp.reason}</p>
                      {wp.exercises?.map((ex, i) => (
                        <div key={i} className="exercise">💪 {ex.name} - {ex.sets} × {ex.reps} | {ex.tip}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 강점 */}
          {analysisResult.strongestMuscles?.length > 0 && (
            <div className="section strong-points">
              <h3>✨ 강점</h3>
              {analysisResult.strongestMuscles.map((sp, idx) => (
                <div key={idx} className="strong-item">
                  <span className="name">{['🥇', '🥈', '🥉'][idx]} {sp.muscle}</span>
                  <span className="score" style={{ color: getScoreColor(sp.score) }}>{sp.score}/10</span>
                </div>
              ))}
            </div>
          )}

          {/* 주간 계획 */}
          {analysisResult.recommendations?.weeklyPlan && (
            <div className="section plan">
              <h3>📅 주간 계획</h3>
              <div className="week-plan">
                {Object.entries(analysisResult.recommendations.weeklyPlan).map(([day, plan]) => (
                  <div key={day} className="day"><span className="day-name">{day.toUpperCase()}</span><span className="day-content">{plan}</span></div>
                ))}
              </div>
            </div>
          )}

          {analysisResult.summary && <div className="summary"><h3>📝 종합</h3><p>{analysisResult.summary}</p></div>}
          {analysisResult.analysisDisclaimer && <div className="disclaimer">⚠️ {analysisResult.analysisDisclaimer}</div>}
        </div>
      )}

      {/* ===== 비교 분석 결과 ===== */}
      {comparisonResult && (
        <div className="comparison-result">
          <h2>🔄 변화 비교 <span className="ver">v{comparisonResult.analysisVersion || '4.2'}</span></h2>

          {/* 조건 매칭 */}
          {comparisonResult.photoConditions?.conditionMatch && (
            <div className="section condition-match">
              <h3>📷 조건 매칭</h3>
              <div className="match-display">
                <div className="match-circle" style={{ borderColor: comparisonResult.photoConditions.conditionMatch.overallMatchScore >= 70 ? '#4CAF50' : comparisonResult.photoConditions.conditionMatch.overallMatchScore >= 40 ? '#FF9800' : '#F44336' }}>
                  <span className="match-num">{comparisonResult.photoConditions.conditionMatch.overallMatchScore}</span>
                  <span className="match-label">%</span>
                </div>
                <div className="match-items">
                  <span className={comparisonResult.photoConditions.conditionMatch.muscleStateMatch ? 'ok' : 'no'}>{comparisonResult.photoConditions.conditionMatch.muscleStateMatch ? '✓' : '✗'} 근육</span>
                  <span className={comparisonResult.photoConditions.conditionMatch.lightingMatch ? 'ok' : 'no'}>{comparisonResult.photoConditions.conditionMatch.lightingMatch ? '✓' : '✗'} 조명</span>
                  <span className={comparisonResult.photoConditions.conditionMatch.distanceMatch ? 'ok' : 'no'}>{comparisonResult.photoConditions.conditionMatch.distanceMatch ? '✓' : '✗'} 거리</span>
                  <span className={comparisonResult.photoConditions.conditionMatch.angleMatch ? 'ok' : 'no'}>{comparisonResult.photoConditions.conditionMatch.angleMatch ? '✓' : '✗'} 각도</span>
                </div>
              </div>
              <div className={`comp-warning ${comparisonResult.photoConditions.conditionMatch.overallComparability}`}>
                <span>비교 신뢰도: {comparisonResult.photoConditions.conditionMatch.overallComparability === 'high' ? '✅ 높음' : comparisonResult.photoConditions.conditionMatch.overallComparability === 'medium' ? '⚠️ 보통' : '❌ 낮음'}</span>
                <p>{comparisonResult.photoConditions.conditionMatch.comparabilityExplanation}</p>
              </div>
            </div>
          )}

          {/* 기간 */}
          {comparisonResult.timePeriod && (
            <div className="section time-period">
              <h3>📅 기간</h3>
              <div className="period-info">
                <span className="days">{comparisonResult.timePeriod.daysBetween}일</span>
                <p>{comparisonResult.timePeriod.realisticChangeExpectation}</p>
              </div>
            </div>
          )}

          {/* 겉보기 vs 실제 */}
          {comparisonResult.apparentVsRealChanges && (
            <div className="section avr">
              <h3>🔍 겉보기 vs 실제</h3>
              <div className="avr-grid">
                <div className="avr-item apparent"><h4>📸 조건 차이</h4><p>{comparisonResult.apparentVsRealChanges.apparentChanges || '없음'}</p></div>
                <div className="avr-item real"><h4>💪 실제 변화</h4><p>{comparisonResult.apparentVsRealChanges.realChanges || '없음'}</p></div>
              </div>
            </div>
          )}

          {/* 변화 점수 */}
          <div className="change-card">
            <div className="change-circle" style={{ backgroundColor: getChangeColor(comparisonResult.changeScore?.toString()) }}>
              <span className="change-num">{comparisonResult.changeScore > 0 ? '+' : ''}{comparisonResult.changeScore}</span>
            </div>
            <div className="change-info">
              <h3>{comparisonResult.overallChange} <ConfidenceBadge level={comparisonResult.changeConfidence} /></h3>
            </div>
          </div>

          {/* 체지방 변화 */}
          {comparisonResult.estimatedBodyFatChange && (
            <div className="section bf-change">
              <h3>📉 체지방 변화</h3>
              <div className="bf-display">
                <span>{comparisonResult.estimatedBodyFatChange.before || '?'}%</span>
                <span className="arrow">→</span>
                <span style={{ color: getChangeColor(comparisonResult.estimatedBodyFatChange.changePercent) }}>{comparisonResult.estimatedBodyFatChange.after || '?'}%</span>
                <span style={{ color: getChangeColor(comparisonResult.estimatedBodyFatChange.changePercent) }}>({comparisonResult.estimatedBodyFatChange.changePercent || '?'})</span>
                <ConfidenceBadge level={comparisonResult.estimatedBodyFatChange.confidence} />
              </div>
            </div>
          )}

          {/* 근육 변화 */}
          {comparisonResult.muscleChanges && (
            <div className="section muscle-changes">
              <h3>💪 근육별 변화</h3>
              <div className="mc-grid">
                {Object.entries(comparisonResult.muscleChanges).map(([m, d]) => {
                  if (!d) return null;
                  return (
                    <div key={m} className={`mc-card ${!d.visibleInBoth ? 'na' : ''}`}>
                      <div className="mc-header"><span className="mc-name">{MUSCLE_NAMES[m]}</span><span className="mc-pct" style={{ color: getChangeColor(d.changePercent) }}>{d.changePercent || '0%'}</span></div>
                      <div className="mc-scores"><span>{d.before ?? '-'}</span><span>→</span><span style={{ color: getChangeColor(d.changePercent) }}>{d.after ?? '-'}</span></div>
                      {!d.visibleInBoth && <p className="mc-na">⚠️ 비교 불가</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TOP 성장 */}
          {comparisonResult.topImproved?.length > 0 && (
            <div className="section top-improved">
              <h3>🏆 TOP 성장</h3>
              {comparisonResult.topImproved.map((item, idx) => (
                <div key={idx} className="top-card">
                  <span className="rank">{['🥇', '🥈', '🥉'][idx]}</span>
                  <span className="name">{item.muscle}</span>
                  <span className="pct" style={{ color: '#4CAF50' }}>{item.changePercent}</span>
                  {item.isRealChange === false && <span className="tag">조건차이?</span>}
                </div>
              ))}
            </div>
          )}

          {/* 추천 */}
          {comparisonResult.recommendations && (
            <div className="section recommendations">
              <h3>🎯 추천</h3>
              {comparisonResult.recommendations.nextGoal && <p className="goal">🏁 {comparisonResult.recommendations.nextGoal}</p>}
              {comparisonResult.recommendations.photoTip && <p className="tip">📷 {comparisonResult.recommendations.photoTip}</p>}
            </div>
          )}

          {comparisonResult.encouragement && <div className="encourage">💪 {comparisonResult.encouragement}</div>}
          {comparisonResult.summary && <div className="summary"><h3>📝 요약</h3><p>{comparisonResult.summary}</p></div>}
          {comparisonResult.analysisDisclaimer && <div className="disclaimer">⚠️ {comparisonResult.analysisDisclaimer}</div>}
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
