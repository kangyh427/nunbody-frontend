import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnalysisView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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

const MUSCLE_CATEGORIES = {
  upperBody: ['shoulders', 'chest', 'back', 'biceps', 'triceps'],
  core: ['abs', 'obliques'],
  lowerBody: ['quads', 'hamstrings', 'glutes', 'calves']
};

const CONDITION_LABELS = {
  muscleState: { flexed: '💪 힘을 준 상태', relaxed: '😌 이완 상태', unknown: '❓ 판단 불가' },
  lighting: { strong: '☀️ 강한 조명', moderate: '🌤️ 보통 조명', weak: '🌙 약한 조명' },
  distance: { close: '🔍 근접 촬영', medium: '📷 중거리', far: '🏔️ 원거리' },
  angle: { front: '정면', side: '측면', back: '후면', angle: '비스듬히' }
};

const ConfidenceBadge = ({ level }) => {
  const configs = {
    high: { label: '신뢰도 높음', color: '#4CAF50', bg: '#E8F5E9' },
    medium: { label: '신뢰도 보통', color: '#FF9800', bg: '#FFF3E0' },
    low: { label: '신뢰도 낮음', color: '#F44336', bg: '#FFEBEE' },
    none: { label: '평가불가', color: '#9E9E9E', bg: '#F5F5F5' }
  };
  const config = configs[level] || configs.none;
  return (
    <span className="confidence-badge" style={{ color: config.color, backgroundColor: config.bg, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', marginLeft: '8px' }}>
      {config.label}
    </span>
  );
};

const getMuscleData = (categoryData, muscleKey) => {
  if (!categoryData || typeof categoryData !== 'object') return null;
  if (categoryData[muscleKey]) return categoryData[muscleKey];
  const lowerKey = muscleKey.toLowerCase();
  for (const key of Object.keys(categoryData)) {
    if (key.toLowerCase() === lowerKey) return categoryData[key];
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

  useEffect(() => { fetchPhotos(); }, []);

  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/photos/my-photos`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) setPhotos(response.data.photos);
    } catch (err) { console.error('사진 로드 실패:', err); }
  };

  const handleAnalyze = async () => {
    if (!selectedPhoto) { setError('분석할 사진을 선택해주세요'); return; }
    setLoading(true); setError(''); setAnalysisResult(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/analysis/analyze`, { photoId: selectedPhoto.id }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) setAnalysisResult(response.data.analysis);
    } catch (err) { setError(err.response?.data?.error || '분석 중 오류가 발생했습니다'); }
    finally { setLoading(false); }
  };

  const handleCompare = async () => {
    if (!selectedPhoto || !comparePhoto) { setError('비교할 사진 2장을 선택해주세요'); return; }
    if (selectedPhoto.id === comparePhoto.id) { setError('서로 다른 사진을 선택해주세요'); return; }
    setLoading(true); setError(''); setComparisonResult(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/analysis/compare`, { photoId1: selectedPhoto.id, photoId2: comparePhoto.id }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) setComparisonResult(response.data.comparison);
    } catch (err) { setError(err.response?.data?.error || '비교 분석 중 오류가 발생했습니다'); }
    finally { setLoading(false); }
  };

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return '#9E9E9E';
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#8BC34A';
    if (score >= 4) return '#FFC107';
    return '#FF5722';
  };

  const getChangeColor = (changePercent) => {
    if (!changePercent || changePercent === '비교불가') return '#9E9E9E';
    const num = parseFloat(changePercent);
    if (isNaN(num)) return '#9E9E9E';
    if (num > 0) return '#4CAF50';
    if (num < 0) return '#FF5722';
    return '#9E9E9E';
  };

  const getScoreChangeColor = (score) => {
    if (score > 0) return '#4CAF50';
    if (score < 0) return '#FF5722';
    return '#9E9E9E';
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const getMuscleScore = (d) => { if (d === null || d === undefined) return null; if (typeof d === 'number') return d; if (typeof d === 'object') { if (d.score !== undefined && d.score !== null) return d.score; if (d.overall !== undefined && d.overall !== null) return d.overall; } return null; };
  const getMuscleDetail = (d) => (typeof d === 'object' && d?.detail) ? d.detail : '';
  const getMuscleConfidence = (d) => (typeof d === 'object' && d?.confidence) ? d.confidence : 'none';
  const isMuscleVisible = (d) => { if (typeof d === 'object') { if (d.visibleInPhoto !== undefined) return d.visibleInPhoto; if (d.score !== null && d.score !== undefined) return true; } return false; };

  const renderMuscleCategory = (categoryName, categoryData, muscles, emoji, title) => (
    <div className="muscle-category">
      <div className="category-header">
        <h4>{emoji} {title}</h4>
        {categoryData && <span className="category-score">{getMuscleScore(categoryData) !== null ? `평균: ${getMuscleScore(categoryData)}/10` : ''}{categoryData?.overallConfidence && <ConfidenceBadge level={categoryData.overallConfidence} />}</span>}
      </div>
      <div className="muscle-detail-grid">
        {categoryData && typeof categoryData === 'object' && muscles.map(muscle => {
          const data = getMuscleData(categoryData, muscle);
          if (!data) return null;
          const score = getMuscleScore(data);
          const confidence = getMuscleConfidence(data);
          const visible = isMuscleVisible(data);
          return (
            <div key={muscle} className={`muscle-detail-item ${!visible ? 'not-visible' : ''}`}>
              <div className="muscle-header">
                <span className="muscle-name">{MUSCLE_NAMES[muscle]}</span>
                <div className="muscle-score-area">
                  {score !== null ? <span className="muscle-score" style={{ color: getScoreColor(score) }}>{score}/10</span> : <span className="muscle-score not-available">평가 불가</span>}
                  <ConfidenceBadge level={confidence} />
                </div>
              </div>
              {score !== null && <div className="bar-container"><div className="bar" style={{ width: `${score * 10}%`, backgroundColor: getScoreColor(score) }}></div></div>}
              {getMuscleDetail(data) && <p className="muscle-comment">{getMuscleDetail(data)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="analysis-container">
      <div className="mode-selector">
        <button className={mode === 'single' ? 'mode-btn active' : 'mode-btn'} onClick={() => setMode('single')}>📷 단일 사진 분석</button>
        <button className={mode === 'compare' ? 'mode-btn active' : 'mode-btn'} onClick={() => setMode('compare')}>🔄 사진 비교 분석</button>
      </div>

      <div className="photo-selection">
        {mode === 'single' ? (
          <div className="single-select">
            <h3>📸 분석할 사진 선택</h3>
            <div className="photo-grid">
              {photos.map(photo => (
                <div key={photo.id} className={`photo-item ${selectedPhoto?.id === photo.id ? 'selected' : ''}`} onClick={() => setSelectedPhoto(photo)}>
                  <img src={photo.photo_url} alt="body" />
                  <span className="photo-date">{formatDate(photo.taken_at)}</span>
                  {selectedPhoto?.id === photo.id && <div className="selected-badge">✓</div>}
                </div>
              ))}
            </div>
            {photos.length === 0 && <p className="no-photos">사진이 없습니다. 먼저 사진을 업로드해주세요.</p>}
          </div>
        ) : (
          <div className="compare-select">
            <div className="compare-column">
              <h3>📅 이전 사진 (Before)</h3>
              <div className="photo-grid">
                {photos.map(photo => (
                  <div key={photo.id} className={`photo-item ${selectedPhoto?.id === photo.id ? 'selected before' : ''}`} onClick={() => setSelectedPhoto(photo)}>
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
                  <div key={photo.id} className={`photo-item ${comparePhoto?.id === photo.id ? 'selected after' : ''}`} onClick={() => setComparePhoto(photo)}>
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

      {error && <div className="error-message">{error}</div>}

      <div className="action-buttons">
        {mode === 'single' ? (
          <button className="analyze-btn" onClick={handleAnalyze} disabled={loading || !selectedPhoto}>{loading ? '🔄 AI 분석 중...' : '🤖 AI 분석 시작'}</button>
        ) : (
          <button className="analyze-btn compare" onClick={handleCompare} disabled={loading || !selectedPhoto || !comparePhoto}>{loading ? '🔄 비교 분석 중...' : '🔄 변화 비교 분석'}</button>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>🤖 AI가 사진을 분석하고 있습니다...</p>
            <p className="loading-sub">사진 조건 분석 + 12개 근육군 정밀 분석 중 (약 10-15초)</p>
          </div>
        </div>
      )}

      {/* 단일 분석 결과 */}
      {analysisResult && (
        <div className="analysis-result">
          <h2>📊 AI 분석 결과</h2>

          {analysisResult.photoConditions && (
            <div className="result-section photo-conditions">
              <h3>📷 사진 조건 분석</h3>
              <div className="conditions-grid">
                <div className="condition-item"><span className="condition-label">근육 상태</span><span className="condition-value">{CONDITION_LABELS.muscleState[analysisResult.photoConditions.muscleState] || analysisResult.photoConditions.muscleState}</span></div>
                <div className="condition-item"><span className="condition-label">조명</span><span className="condition-value">{CONDITION_LABELS.lighting[analysisResult.photoConditions.lighting] || analysisResult.photoConditions.lighting}</span></div>
                <div className="condition-item"><span className="condition-label">촬영 거리</span><span className="condition-value">{CONDITION_LABELS.distance[analysisResult.photoConditions.distance] || analysisResult.photoConditions.distance}</span></div>
                <div className="condition-item"><span className="condition-label">촬영 각도</span><span className="condition-value">{CONDITION_LABELS.angle[analysisResult.photoConditions.angle] || analysisResult.photoConditions.angle}</span></div>
              </div>
              {analysisResult.photoConditions.analysisLimitations && <p className="limitations-note">⚠️ {analysisResult.photoConditions.analysisLimitations}</p>}
            </div>
          )}
          
          <div className="score-card">
            <div className="score-circle" style={{ borderColor: getScoreColor(analysisResult.overallScore / 10) }}>
              <span className="score-number">{analysisResult.overallScore || '-'}</span>
              <span className="score-label">점</span>
            </div>
            <div className="score-info">
              <div className="score-title-row"><h3>{analysisResult.bodyType}</h3>{analysisResult.overallConfidence && <ConfidenceBadge level={analysisResult.overallConfidence} />}</div>
              <p>{analysisResult.bodyTypeDescription}</p>
            </div>
          </div>

          {analysisResult.visibleMusclesSummary && (
            <div className="result-section visibility-summary">
              <h3>👁️ 근육 가시성 요약</h3>
              <div className="visibility-grid">
                {analysisResult.visibleMusclesSummary.fullyVisible?.length > 0 && <div className="visibility-item visible"><span className="visibility-label">✅ 명확히 보임</span><span className="visibility-muscles">{analysisResult.visibleMusclesSummary.fullyVisible.join(', ')}</span></div>}
                {analysisResult.visibleMusclesSummary.partiallyVisible?.length > 0 && <div className="visibility-item partial"><span className="visibility-label">🔶 부분적으로 보임</span><span className="visibility-muscles">{analysisResult.visibleMusclesSummary.partiallyVisible.join(', ')}</span></div>}
                {analysisResult.visibleMusclesSummary.notVisible?.length > 0 && <div className="visibility-item not-visible"><span className="visibility-label">❌ 확인 불가</span><span className="visibility-muscles">{analysisResult.visibleMusclesSummary.notVisible.join(', ')}</span></div>}
              </div>
            </div>
          )}

          {analysisResult.estimatedMeasurements && (
            <div className="result-section">
              <h3>📐 추정 신체 치수</h3>
              <div className="measurements-grid">
                <div className="measure-item"><span className="label">어깨 너비</span><span className="value">{analysisResult.estimatedMeasurements.shoulderWidth || '확인 불가'}</span></div>
                <div className="measure-item"><span className="label">가슴 둘레</span><span className="value">{analysisResult.estimatedMeasurements.chestCircumference || '확인 불가'}</span></div>
                <div className="measure-item"><span className="label">허리 둘레</span><span className="value">{analysisResult.estimatedMeasurements.waistCircumference || '확인 불가'}</span></div>
                <div className="measure-item"><span className="label">좌우 대칭</span><span className="value">{analysisResult.estimatedMeasurements.bodySymmetry !== null ? `${analysisResult.estimatedMeasurements.bodySymmetry}/10` : '확인 불가'}</span></div>
              </div>
              {analysisResult.estimatedMeasurements.measurementConfidence && <div className="measurement-confidence">측정 신뢰도: <ConfidenceBadge level={analysisResult.estimatedMeasurements.measurementConfidence} /></div>}
            </div>
          )}

          {analysisResult.posture && (
            <div className="result-section">
              <h3>🧘 자세 분석</h3>
              <div className="posture-header">{analysisResult.posture.score !== null && <span className="posture-score">자세 점수: {analysisResult.posture.score}점</span>}{analysisResult.posture.confidence && <ConfidenceBadge level={analysisResult.posture.confidence} />}</div>
              <div className="posture-grid">
                <div className="posture-item"><span className="label">척추 정렬</span><span className="value">{analysisResult.posture.spineAlignment || '확인 불가'}</span></div>
                <div className="posture-item"><span className="label">어깨 균형</span><span className="value">{analysisResult.posture.shoulderBalance || '확인 불가'}</span></div>
                <div className="posture-item"><span className="label">머리 위치</span><span className="value">{analysisResult.posture.headPosition || '확인 불가'}</span></div>
                <div className="posture-item"><span className="label">골반 상태</span><span className="value">{analysisResult.posture.pelvisTilt || '확인 불가'}</span></div>
              </div>
            </div>
          )}

          {analysisResult.muscleAnalysis && (
            <div className="result-section">
              <h3>💪 세부 근육 분석 (12개 근육군)</h3>
              {renderMuscleCategory('upperBody', analysisResult.muscleAnalysis.upperBody, MUSCLE_CATEGORIES.upperBody, '🏋️', '상체 (Upper Body)')}
              {renderMuscleCategory('core', analysisResult.muscleAnalysis.core, MUSCLE_CATEGORIES.core, '🎯', '코어 (Core)')}
              {renderMuscleCategory('lowerBody', analysisResult.muscleAnalysis.lowerBody, MUSCLE_CATEGORIES.lowerBody, '🦵', '하체 (Lower Body)')}
            </div>
          )}

          {analysisResult.weakestMuscles?.length > 0 && (
            <div className="result-section">
              <h3>🎯 집중 강화 필요 근육</h3>
              <div className="weak-muscles-list">
                {analysisResult.weakestMuscles.map((item, idx) => (
                  <div key={idx} className="weak-muscle-card">
                    <div className="weak-muscle-header" onClick={() => setExpandedMuscle(expandedMuscle === idx ? null : idx)}>
                      <div className="rank-badge">#{item.rank || idx + 1}</div>
                      <div className="weak-muscle-info">
                        <span className="muscle-name">{item.muscle}</span>
                        <div className="muscle-meta"><span className="muscle-score-badge" style={{ backgroundColor: getScoreColor(item.score) }}>{item.score}/10</span>{item.confidence && <ConfidenceBadge level={item.confidence} />}</div>
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
                              <span className="exercise-name">{typeof ex === 'string' ? ex : ex.name}</span>
                              {typeof ex === 'object' && <div className="exercise-detail"><span className="sets">{ex.sets}</span><span className="reps">{ex.reps}</span>{ex.tip && <p className="tip">💡 {ex.tip}</p>}</div>}
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

          {analysisResult.strongestMuscles?.length > 0 && (
            <div className="result-section">
              <h3>💪 강점 근육</h3>
              <div className="strength-list">
                {analysisResult.strongestMuscles.map((item, idx) => (
                  <div key={idx} className="strength-item">
                    <div className="strength-header"><span className="strength-name">✅ {item.muscle}</span><div className="strength-meta"><span className="strength-score" style={{ color: getScoreColor(item.score) }}>{item.score}/10</span>{item.confidence && <ConfidenceBadge level={item.confidence} />}</div></div>
                    {item.detail && <p className="strength-detail">{item.detail}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisResult.recommendations?.weeklyPlan && (
            <div className="result-section">
              <h3>📅 맞춤 주간 운동 계획</h3>
              <div className="weekly-plan">{Object.entries(analysisResult.recommendations.weeklyPlan).map(([day, plan]) => (<div key={day} className="day-plan"><span className="day-label">{day.toUpperCase()}</span><span className="day-content">{plan}</span></div>))}</div>
              {analysisResult.recommendations.nutritionTip && <p className="nutrition-tip">🥗 영양 팁: {analysisResult.recommendations.nutritionTip}</p>}
              {analysisResult.recommendations.restTip && <p className="rest-tip">😴 휴식 팁: {analysisResult.recommendations.restTip}</p>}
            </div>
          )}

          {analysisResult.summary && <div className="summary-card"><h3>📝 종합 평가</h3><p>{analysisResult.summary}</p></div>}
          {analysisResult.analysisDisclaimer && <div className="disclaimer-card"><p>⚠️ {analysisResult.analysisDisclaimer}</p></div>}
        </div>
      )}

      {/* 비교 분석 결과 */}
      {comparisonResult && (
        <div className="comparison-result">
          <h2>🔄 변화 비교 분석 결과</h2>

          {comparisonResult.photoConditions && (
            <div className="result-section photo-conditions-compare">
              <h3>📷 사진 조건 비교</h3>
              <div className="conditions-compare-grid">
                <div className="condition-compare-column"><h4>Before 사진</h4><div className="condition-tags"><span className="tag">{CONDITION_LABELS.muscleState[comparisonResult.photoConditions.before?.muscleState] || comparisonResult.photoConditions.before?.muscleState}</span><span className="tag">{CONDITION_LABELS.lighting[comparisonResult.photoConditions.before?.lighting] || comparisonResult.photoConditions.before?.lighting}</span></div></div>
                <div className="condition-compare-column"><h4>After 사진</h4><div className="condition-tags"><span className="tag">{CONDITION_LABELS.muscleState[comparisonResult.photoConditions.after?.muscleState] || comparisonResult.photoConditions.after?.muscleState}</span><span className="tag">{CONDITION_LABELS.lighting[comparisonResult.photoConditions.after?.lighting] || comparisonResult.photoConditions.after?.lighting}</span></div></div>
              </div>
              {comparisonResult.photoConditions.conditionDifferences && (
                <div className={`comparability-warning ${comparisonResult.photoConditions.conditionDifferences.overallComparability}`}>
                  <span className="comparability-label">비교 신뢰도: {comparisonResult.photoConditions.conditionDifferences.overallComparability === 'high' ? '✅ 높음' : comparisonResult.photoConditions.conditionDifferences.overallComparability === 'medium' ? '⚠️ 보통' : '❌ 낮음'}</span>
                  <p>{comparisonResult.photoConditions.conditionDifferences.comparabilityExplanation}</p>
                </div>
              )}
            </div>
          )}

          {comparisonResult.timePeriod && (
            <div className="result-section time-period"><h3>📅 기간 분석</h3><div className="period-info"><span className="period-days">{comparisonResult.timePeriod.daysBetween}일 차이</span><p className="period-expectation">{comparisonResult.timePeriod.realisticChangeExpectation}</p></div></div>
          )}

          <div className="change-score-card">
            <div className="change-indicator" style={{ backgroundColor: getScoreChangeColor(comparisonResult.changeScore) }}><span className="change-number">{comparisonResult.changeScore > 0 ? '+' : ''}{comparisonResult.changeScore}</span></div>
            <div className="change-info"><div className="change-title-row"><h3>{comparisonResult.overallChange}</h3>{comparisonResult.changeConfidence && <ConfidenceBadge level={comparisonResult.changeConfidence} />}</div>{comparisonResult.periodAnalysis && <p>{comparisonResult.periodAnalysis}</p>}</div>
          </div>

          {comparisonResult.apparentVsRealChanges && (
            <div className="result-section apparent-vs-real">
              <h3>🔍 겉보기 변화 vs 실제 변화</h3>
              <div className="avr-grid">
                <div className="avr-item apparent"><h4>📸 사진 조건으로 인한 차이</h4><p>{comparisonResult.apparentVsRealChanges.apparentChanges || '없음'}</p></div>
                <div className="avr-item real"><h4>💪 실제 체형/근육 변화</h4><p>{comparisonResult.apparentVsRealChanges.realChanges || '없음'}</p></div>
                {comparisonResult.apparentVsRealChanges.uncertainChanges && <div className="avr-item uncertain"><h4>❓ 불확실한 부분</h4><p>{comparisonResult.apparentVsRealChanges.uncertainChanges}</p></div>}
              </div>
            </div>
          )}

          {(comparisonResult.beforeScore || comparisonResult.afterScore) && (
            <div className="result-section"><h3>📊 전후 점수 비교</h3><div className="before-after-scores"><div className="ba-score before"><span className="ba-label">Before</span><span className="ba-value">{comparisonResult.beforeScore || '-'}점</span></div><div className="ba-arrow">→</div><div className="ba-score after"><span className="ba-label">After</span><span className="ba-value">{comparisonResult.afterScore || '-'}점</span></div></div></div>
          )}

          {comparisonResult.muscleChanges && (
            <div className="result-section">
              <h3>💪 근육별 변화 상세</h3>
              <div className="muscle-changes-grid">
                {Object.entries(comparisonResult.muscleChanges).map(([muscle, data]) => {
                  if (!data || typeof data !== 'object') return null;
                  const visibleInBoth = data.visibleInBoth !== false;
                  return (
                    <div key={muscle} className={`muscle-change-card ${!visibleInBoth ? 'not-comparable' : ''}`}>
                      <div className="mc-header"><span className="mc-name">{MUSCLE_NAMES[muscle] || muscle}</span><div className="mc-meta"><span className="mc-percent" style={{ color: getChangeColor(data.changePercent) }}>{data.changePercent || '0%'}</span>{data.confidence && <ConfidenceBadge level={data.confidence} />}</div></div>
                      <div className="mc-scores"><span className="mc-before">{data.before !== null ? data.before : '-'}</span><span className="mc-arrow">→</span><span className="mc-after" style={{ color: getChangeColor(data.changePercent) }}>{data.after !== null ? data.after : '-'}</span></div>
                      {data.detail && <p className="mc-detail">{data.detail}</p>}
                      {!visibleInBoth && <p className="mc-not-visible">⚠️ 한쪽 사진에서 확인 불가</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {comparisonResult.topImproved?.length > 0 && (
            <div className="result-section">
              <h3>🏆 가장 성장한 근육</h3>
              <div className="top-improved-list">
                {comparisonResult.topImproved.map((item, idx) => (
                  <div key={idx} className="improved-card">
                    <div className="improved-rank">{['🥇', '🥈', '🥉'][idx] || `#${idx + 1}`}</div>
                    <div className="improved-info"><span className="improved-muscle">{item.muscle}</span><div className="improved-meta"><span className="improved-percent" style={{ color: '#4CAF50' }}>{item.changePercent}</span>{item.confidence && <ConfidenceBadge level={item.confidence} />}</div></div>
                    {item.detail && <p className="improved-detail">{item.detail}</p>}
                    {item.keepDoingExercises && <div className="keep-doing"><span className="keep-label">계속하면 좋은 운동:</span>{item.keepDoingExercises.map((ex, exIdx) => <span key={exIdx} className="keep-exercise">{ex}</span>)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparisonResult.needsWork?.length > 0 && (
            <div className="result-section">
              <h3>🎯 더 집중이 필요한 근육</h3>
              <div className="needs-work-list">
                {comparisonResult.needsWork.map((item, idx) => (
                  <div key={idx} className="needs-work-card">
                    <div className="nw-header"><span className="nw-muscle">{item.muscle}</span><div className="nw-meta"><span className="nw-percent" style={{ color: getChangeColor(item.changePercent) }}>{item.changePercent}</span>{item.confidence && <ConfidenceBadge level={item.confidence} />}</div></div>
                    {item.reason && <p className="nw-reason">💡 {item.reason}</p>}
                    {item.recommendedExercises && <div className="nw-exercises"><span className="nw-ex-label">추천 운동:</span>{item.recommendedExercises.map((ex, exIdx) => <div key={exIdx} className="nw-exercise"><span className="ex-name">{typeof ex === 'string' ? ex : ex.name}</span>{typeof ex === 'object' && <span className="ex-detail">{ex.sets} × {ex.reps}</span>}</div>)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparisonResult.bodyComposition && (
            <div className="result-section">
              <h3>⚖️ 체성분 변화 추정</h3>
              <div className="body-comp-grid">
                <div className="comp-item"><span className="comp-label">체지방</span><div className="comp-value-area"><span className="comp-value">{comparisonResult.bodyComposition.fatChange}</span>{comparisonResult.bodyComposition.fatChangeConfidence && <ConfidenceBadge level={comparisonResult.bodyComposition.fatChangeConfidence} />}</div></div>
                <div className="comp-item"><span className="comp-label">근육량</span><div className="comp-value-area"><span className="comp-value">{comparisonResult.bodyComposition.muscleChange}</span>{comparisonResult.bodyComposition.muscleChangeConfidence && <ConfidenceBadge level={comparisonResult.bodyComposition.muscleChangeConfidence} />}</div></div>
              </div>
              {comparisonResult.bodyComposition.detail && <p className="comp-detail">{comparisonResult.bodyComposition.detail}</p>}
            </div>
          )}

          {comparisonResult.encouragement && <div className="encouragement-card"><p>💪 {comparisonResult.encouragement}</p></div>}

          {comparisonResult.recommendations && (
            <div className="result-section">
              <h3>🎯 다음 단계 추천</h3>
              {comparisonResult.recommendations.nextGoal && <p className="next-goal">🏁 다음 목표: {comparisonResult.recommendations.nextGoal}</p>}
              {comparisonResult.recommendations.focusMuscles && <div className="focus-muscles"><span className="focus-label">집중 근육:</span>{comparisonResult.recommendations.focusMuscles.map((m, idx) => <span key={idx} className="focus-tag">{m}</span>)}</div>}
              {comparisonResult.recommendations.photoTip && <p className="photo-tip">📷 촬영 팁: {comparisonResult.recommendations.photoTip}</p>}
              {comparisonResult.recommendations.weeklyPlan && <div className="weekly-plan">{Object.entries(comparisonResult.recommendations.weeklyPlan).map(([day, plan]) => <div key={day} className="day-plan"><span className="day-label">{day}</span><span className="day-content">{plan}</span></div>)}</div>}
              {comparisonResult.recommendations.nutritionTip && <p className="nutrition-tip">🥗 {comparisonResult.recommendations.nutritionTip}</p>}
            </div>
          )}

          {comparisonResult.summary && <div className="summary-card"><h3>📝 분석 요약</h3><p>{comparisonResult.summary}</p></div>}
          {comparisonResult.analysisDisclaimer && <div className="disclaimer-card"><p>⚠️ {comparisonResult.analysisDisclaimer}</p></div>}
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
