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

  useEffect(() => { fetchPhotos(); fetchUserProfile(); }, []);

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
            <p className="modal-desc">정확한 분석을 위해 입력해주세요. AI가 실측치 계산에 활용합니다.</p>
            <div className="form-row">
              <div className="form-group"><label>키(cm)</label><input type="number" placeholder="175" value={userProfile.height_cm} onChange={(e) => setUserProfile({...userProfile, height_cm: e.target.value})} /></div>
              <div className="form-group"><label>몸무게(kg)</label><input type="number" placeholder="70" value={userProfile.weight_kg} onChange={(e) => setUserProfile({...userProfile, weight_kg: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>나이</label><input type="number" placeholder="30" value={userProfile.age} onChange={(e) => setUserProfile({...userProfile, age: e.target.value})} /></div>
              <div className="form-group"><label>성별</label><select value={userProfile.gender} onChange={(e) => setUserProfile({...userProfile, gender: e.target.value})}><option value="">선택</option><option value="male">남성</option><option value="female">여성</option></select></div>
            </div>
            <div className="modal-btns"><button className="btn-cancel" onClick={() => setShowProfileModal(false)}>취소</button><button className="btn-save" onClick={saveUserProfile}>저장</button></div>
          </div>
        </div>
      )}

      {/* 모드 선택 */}
      <div className="mode-selector">
        <button className={mode === 'single' ? 'mode-btn active' : 'mode-btn'} onClick={() => setMode('single')}>📷 단일 분석</button>
        <button className={mode === 'compare' ? 'mode-btn active' : 'mode-btn'} onClick={() => setMode('compare')}>🔄 비교 분석</button>
      </div>

      {/* 사진 선택 */}
      <div className="photo-selection">
        {mode === 'single' ? (
          <div className="single-select">
            <h3>📸 분석할 사진</h3>
            <div className="photo-grid">
              {photos.map(p => (
                <div key={p.id} className={`photo-item ${selectedPhoto?.id === p.id ? 'selected' : ''}`} onClick={() => setSelectedPhoto(p)}>
                  <img src={p.photo_url} alt="" />
                  <span className="photo-date">{formatDate(p.taken_at)}</span>
                  {selectedPhoto?.id === p.id && <div className="selected-badge">✓</div>}
                </div>
              ))}
            </div>
            {photos.length === 0 && <p className="no-photos">사진이 없습니다.</p>}
          </div>
        ) : (
          <div className="compare-select">
            <div className="compare-col">
              <h3>📅 Before</h3>
              <div className="photo-grid">
                {photos.map(p => (
                  <div key={p.id} className={`photo-item ${selectedPhoto?.id === p.id ? 'selected before' : ''}`} onClick={() => setSelectedPhoto(p)}>
                    <img src={p.photo_url} alt="" />
                    <span className="photo-date">{formatDate(p.taken_at)}</span>
                    {selectedPhoto?.id === p.id && <div className="selected-badge before">이전</div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="compare-col">
              <h3>📅 After</h3>
              <div className="photo-grid">
                {photos.map(p => (
                  <div key={p.id} className={`photo-item ${comparePhoto?.id === p.id ? 'selected after' : ''}`} onClick={() => setComparePhoto(p)}>
                    <img src={p.photo_url} alt="" />
                    <span className="photo-date">{formatDate(p.taken_at)}</span>
                    {comparePhoto?.id === p.id && <div className="selected-badge after">이후</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="action-btns">
        {mode === 'single' ? (
          <button className="analyze-btn" onClick={handleAnalyze} disabled={loading || !selectedPhoto}>{loading ? '🔄 분석 중...' : '🤖 AI 정밀 분석'}</button>
        ) : (
          <button className="analyze-btn compare" onClick={handleCompare} disabled={loading || !selectedPhoto || !comparePhoto}>{loading ? '🔄 비교 중...' : '🔄 변화 정밀 비교'}</button>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner"></div>
            <p>🤖 AI 정밀 분석 중...</p>
            <p className="loading-sub">{userProfile.height_cm ? `📏 ${userProfile.height_cm}cm 기준 축척 계산` : '사진 조건 분석'} + 12개 근육군</p>
          </div>
        </div>
      )}

      {/* ===== 단일 분석 결과 ===== */}
      {analysisResult && (
        <div className="analysis-result">
          <h2>📊 AI 정밀 분석 <span className="ver">v4.1</span></h2>

          {/* 사진 조건 */}
          {analysisResult.photoConditions && (
            <div className="section photo-cond">
              <h3>📷 사진 조건</h3>
              <div className="cond-grid">
                <div className="cond-item"><span className="cond-label">근육</span><span>{CONDITION_LABELS.muscleState[analysisResult.photoConditions.muscleState] || analysisResult.photoConditions.muscleState}</span></div>
                <div className="cond-item"><span className="cond-label">조명</span><span>{CONDITION_LABELS.lighting[analysisResult.photoConditions.lighting] || analysisResult.photoConditions.lighting}</span></div>
                <div className="cond-item"><span className="cond-label">거리</span><span>{CONDITION_LABELS.distance[analysisResult.photoConditions.distance] || analysisResult.photoConditions.distance}</span></div>
                <div className="cond-item"><span className="cond-label">신뢰도</span><ConfidenceBadge level={analysisResult.photoConditions.analysisReliability} /></div>
              </div>
              {analysisResult.photoConditions.analysisLimitations && <p className="limit-note">⚠️ {analysisResult.photoConditions.analysisLimitations}</p>}
            </div>
          )}

          {/* 축척 보정 */}
          {analysisResult.spatialCalibration && (
            <div className="section calibration">
              <h3>📐 축척 보정</h3>
              <div className="cal-grid">
                <span>기준: {analysisResult.spatialCalibration.primaryAnchor}</span>
                {analysisResult.spatialCalibration.pixelsPerCm && <span>{analysisResult.spatialCalibration.pixelsPerCm} px/cm</span>}
                <ConfidenceBadge level={analysisResult.spatialCalibration.calibrationConfidence} />
              </div>
            </div>
          )}

          {/* 전체 점수 */}
          <div className="score-card">
            <div className="score-circle" style={{ borderColor: getScoreColor(analysisResult.overallScore / 10) }}>
              <span className="score-num">{analysisResult.overallScore || '-'}</span>
              <span className="score-label">점</span>
            </div>
            <div className="score-info">
              <h3>{analysisResult.bodyType} <ConfidenceBadge level={analysisResult.overallConfidence} /></h3>
              <p>{analysisResult.bodyTypeDescription}</p>
              {analysisResult.estimatedBodyFatPercent && (
                <div className="bf-est">추정 체지방: <strong>{analysisResult.estimatedBodyFatPercent}%</strong> <ConfidenceBadge level={analysisResult.bodyFatConfidence} /></div>
              )}
            </div>
          </div>

          {/* 질감 분석 */}
          {analysisResult.textureAnalysis && (
            <div className="section texture">
              <h3>🔬 질감 분석</h3>
              <div className="tex-grid">
                <div className="tex-item"><span>데피니션</span><span style={{ color: getScoreColor(analysisResult.textureAnalysis.overallDefinition) }}>{analysisResult.textureAnalysis.overallDefinition}/10</span></div>
                <div className="tex-item"><span>혈관 비침</span><span>{analysisResult.textureAnalysis.vascularity === 'none' ? '없음' : analysisResult.textureAnalysis.vascularity === 'minimal' ? '약간' : analysisResult.textureAnalysis.vascularity === 'moderate' ? '보통' : '높음'}</span></div>
                <div className="tex-item"><span>피하지방</span><span>{analysisResult.textureAnalysis.skinFoldEstimate === 'thick' ? '두꺼움' : analysisResult.textureAnalysis.skinFoldEstimate === 'moderate' ? '보통' : analysisResult.textureAnalysis.skinFoldEstimate === 'thin' ? '얇음' : '매우 얇음'}</span></div>
              </div>
              {analysisResult.textureAnalysis.note && <p className="tex-note">{analysisResult.textureAnalysis.note}</p>}
            </div>
          )}

          {/* 추정 치수 */}
          {analysisResult.estimatedMeasurements && (
            <div className="section measurements">
              <h3>📏 추정 신체 치수</h3>
              <div className="meas-grid">
                <div className="meas-item"><span>어깨</span><span>{analysisResult.estimatedMeasurements.shoulderWidth || '-'}</span></div>
                <div className="meas-item"><span>가슴</span><span>{analysisResult.estimatedMeasurements.chestCircumference || '-'}</span></div>
                <div className="meas-item"><span>허리</span><span>{analysisResult.estimatedMeasurements.waistCircumference || '-'}</span></div>
                <div className="meas-item"><span>팔</span><span>{analysisResult.estimatedMeasurements.armCircumference || '-'}</span></div>
                <div className="meas-item"><span>허벅지</span><span>{analysisResult.estimatedMeasurements.thighCircumference || '-'}</span></div>
                <div className="meas-item"><span>대칭</span><span>{analysisResult.estimatedMeasurements.bodySymmetry ? `${analysisResult.estimatedMeasurements.bodySymmetry}/10` : '-'}</span></div>
              </div>
              {analysisResult.estimatedMeasurements.measurementNote && <p className="meas-note">{analysisResult.estimatedMeasurements.measurementNote}</p>}
            </div>
          )}

          {/* 근육 분석 */}
          {analysisResult.muscleAnalysis && (
            <div className="section muscles">
              <h3>💪 세부 근육 분석</h3>
              <div className="muscle-category"><h4>🏋️ 상체</h4><div className="muscle-list">{MUSCLE_CATEGORIES.upperBody.map(m => renderMuscle(m, getMuscleData(analysisResult.muscleAnalysis.upperBody, m)))}</div></div>
              <div className="muscle-category"><h4>🎯 코어</h4><div className="muscle-list">{MUSCLE_CATEGORIES.core.map(m => renderMuscle(m, getMuscleData(analysisResult.muscleAnalysis.core, m)))}</div></div>
              <div className="muscle-category"><h4>🦵 하체</h4><div className="muscle-list">{MUSCLE_CATEGORIES.lowerBody.map(m => renderMuscle(m, getMuscleData(analysisResult.muscleAnalysis.lowerBody, m)))}</div></div>
            </div>
          )}

          {/* 약점/강점 */}
          {analysisResult.weakestMuscles?.length > 0 && (
            <div className="section weak">
              <h3>🎯 강화 필요</h3>
              {analysisResult.weakestMuscles.map((item, idx) => (
                <div key={idx} className="weak-card" onClick={() => setExpandedMuscle(expandedMuscle === idx ? null : idx)}>
                  <div className="weak-header">
                    <span className="rank">#{item.rank || idx + 1}</span>
                    <span className="name">{item.muscle}</span>
                    <span className="score" style={{ backgroundColor: getScoreColor(item.score) }}>{item.score}/10</span>
                    <span className="expand">{expandedMuscle === idx ? '▲' : '▼'}</span>
                  </div>
                  {expandedMuscle === idx && (
                    <div className="weak-detail">
                      {item.reason && <p className="reason">💡 {item.reason}</p>}
                      {item.exercises?.map((ex, i) => <div key={i} className="exercise">{ex.name} - {ex.sets} × {ex.reps}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {analysisResult.strongestMuscles?.length > 0 && (
            <div className="section strong">
              <h3>💪 강점</h3>
              {analysisResult.strongestMuscles.map((item, idx) => (
                <div key={idx} className="strong-item">
                  <span className="name">✅ {item.muscle}</span>
                  <span className="score" style={{ color: getScoreColor(item.score) }}>{item.score}/10</span>
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
          <h2>🔄 변화 비교 <span className="ver">v4.1</span></h2>

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
