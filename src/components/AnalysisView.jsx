import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, Cell
} from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';
import './AnalysisView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const MUSCLE_KEYS = ['shoulders', 'chest', 'back', 'biceps', 'triceps', 'abs', 'obliques', 'quads', 'hamstrings', 'glutes', 'calves'];
const MUSCLE_CATEGORIES = {
  upperBody: ['shoulders', 'chest', 'back', 'biceps', 'triceps'],
  core: ['abs', 'obliques'],
  lowerBody: ['quads', 'hamstrings', 'glutes', 'calves']
};

const getScoreColor = (s) => s === null ? '#9E9E9E' : s >= 8 ? '#4CAF50' : s >= 6 ? '#8BC34A' : s >= 4 ? '#FFC107' : s >= 2 ? '#FF9800' : '#FF5722';
const getChangeColor = (c) => { if (!c || c === 'N/A') return '#9E9E9E'; const n = parseFloat(c); return isNaN(n) ? '#9E9E9E' : n > 0 ? '#4CAF50' : n < 0 ? '#FF5722' : '#9E9E9E'; };

const AnalysisView = () => {
  const { t, language } = useLanguage();
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
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);

  useEffect(() => { fetchPhotos(); fetchUserProfile(); }, []);
  useEffect(() => { if (mode === 'history' || mode === 'trend') fetchHistory(); }, [mode]);

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

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/analysis/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setHistory(res.data.history);
    } catch (err) { console.error(err); }
    finally { setHistoryLoading(false); }
  };

  const fetchHistoryDetail = async (historyId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/analysis/history/${historyId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setSelectedHistory(res.data.history);
        setShowHistoryDetail(true);
        if (res.data.history.analysisType === 'single') { setAnalysisResult(res.data.history.result); setComparisonResult(null); }
        else { setComparisonResult(res.data.history.result); setAnalysisResult(null); }
      }
    } catch (err) { setError(t('analysis.historyLoadFailed')); }
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
    if (!selectedPhoto) { setError(t('upload.selectPhoto')); return; }
    setLoading(true); setError(''); setAnalysisResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/analysis/analyze`, { photoId: selectedPhoto.id }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setAnalysisResult(res.data.analysis);
    } catch (err) { setError(err.response?.data?.error || t('analysis.analysisError')); }
    finally { setLoading(false); }
  };

  const handleCompare = async () => {
    if (!selectedPhoto || !comparePhoto) { setError(t('analysis.selectTwo')); return; }
    if (selectedPhoto.id === comparePhoto.id) { setError(t('analysis.selectDifferent')); return; }
    setLoading(true); setError(''); setComparisonResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/analysis/compare`, { photoId1: selectedPhoto.id, photoId2: comparePhoto.id }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setComparisonResult(res.data.comparison);
    } catch (err) { setError(err.response?.data?.error || t('analysis.compareError')); }
    finally { setLoading(false); }
  };

  const getMuscleScore = (d) => d === null ? null : typeof d === 'number' ? d : d?.score ?? null;
  const getMuscleData = (cat, key) => cat?.[key] || null;
  const formatDate = (d) => new Date(d).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatDateTime = (d) => new Date(d).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getConfidenceLabel = (level) => ({ high: t('analysis.confidenceHigh'), medium: t('analysis.confidenceMedium'), low: t('analysis.confidenceLow'), none: t('analysis.confidenceNone') }[level] || t('analysis.confidenceNone'));
  const getConfidenceColor = (level) => ({ high: '#4CAF50', medium: '#FF9800', low: '#F44336', none: '#9E9E9E' }[level] || '#9E9E9E');

  const ConfidenceBadge = ({ level }) => (
    <span className="confidence-badge" style={{ color: getConfidenceColor(level), backgroundColor: `${getConfidenceColor(level)}15` }}>
      {getConfidenceLabel(level)}
    </span>
  );

  // Build chart data
  const buildRadarData = (ma) => {
    if (!ma) return [];
    const all = { ...ma.upperBody, ...ma.core, ...ma.lowerBody };
    return MUSCLE_KEYS.map(key => {
      const score = getMuscleScore(all[key]);
      return score !== null ? { muscle: t(`analysis.muscles.${key}`), score, fullMark: 10 } : null;
    }).filter(Boolean);
  };

  const buildBarData = (ma) => {
    if (!ma) return [];
    const all = { ...ma.upperBody, ...ma.core, ...ma.lowerBody };
    return MUSCLE_KEYS.map(key => {
      const d = all[key];
      return { muscle: t(`analysis.muscles.${key}`), key, score: getMuscleScore(d) || 0, confidence: d?.confidence || 'none', visible: d?.visibleInPhoto !== false };
    });
  };

  const buildTrendData = () => {
    return history
      .filter(h => h.analysis_type === 'single' && h.overall_score)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(h => ({ date: formatDate(h.created_at), score: h.overall_score, bodyFat: h.body_fat_percent || null }));
  };

  const getCondLabel = (type, value) => {
    const map = {
      muscleState: { flexed: t('analysis.flexed'), relaxed: t('analysis.relaxed'), unknown: t('analysis.unknown') },
      lighting: { strong: t('analysis.lightStrong'), moderate: t('analysis.lightModerate'), weak: t('analysis.lightWeak') },
      distance: { close: t('analysis.distClose'), medium: t('analysis.distMedium'), far: t('analysis.distFar') },
    };
    return map[type]?.[value] || value;
  };

  const renderMuscle = (muscle, data) => {
    if (!data) return null;
    const score = getMuscleScore(data);
    const conf = data?.confidence || 'none';
    const visible = data?.visibleInPhoto !== false;
    return (
      <div key={muscle} className={`muscle-item ${!visible ? 'not-visible' : ''}`}>
        <div className="muscle-row">
          <span className="muscle-name">{t(`analysis.muscles.${muscle}`)}</span>
          <div className="muscle-score-area">
            {score !== null ? <span className="muscle-score" style={{ color: getScoreColor(score) }}>{score}/10</span> : <span className="muscle-score na">N/A</span>}
            <ConfidenceBadge level={conf} />
          </div>
        </div>
        {score !== null && <div className="bar-wrap"><div className="bar" style={{ width: `${score * 10}%`, backgroundColor: getScoreColor(score) }}></div></div>}
        {!visible && <p className="muscle-detail">{t('analysis.reliabilityNote')}</p>}
        {data?.detail && visible && <p className="muscle-detail">{data.detail}</p>}
      </div>
    );
  };

  // Reliability Indicator component
  const ReliabilityIndicator = ({ muscleAnalysis }) => {
    if (!muscleAnalysis) return null;
    const all = { ...muscleAnalysis.upperBody, ...muscleAnalysis.core, ...muscleAnalysis.lowerBody };
    const visible = [], hidden = [];
    MUSCLE_KEYS.forEach(key => {
      const d = all[key];
      if (d?.visibleInPhoto === false) hidden.push(key);
      else if (d) visible.push({ key, confidence: d.confidence || 'none' });
    });
    return (
      <div className="section reliability">
        <h3>{t('analysis.reliabilityTitle')}</h3>
        <div className="reliability-grid">
          {visible.length > 0 && (
            <div className="reliability-group visible-group">
              <h4>{t('analysis.visiblePart')}</h4>
              <div className="reliability-items">
                {visible.map(({ key, confidence }) => (
                  <span key={key} className={`rel-item rel-${confidence}`}>{t(`analysis.muscles.${key}`)}</span>
                ))}
              </div>
            </div>
          )}
          {hidden.length > 0 && (
            <div className="reliability-group hidden-group">
              <h4>{t('analysis.hiddenPart')}</h4>
              <div className="reliability-items">
                {hidden.map(key => (
                  <span key={key} className="rel-item rel-hidden">{t(`analysis.muscles.${key}`)}</span>
                ))}
              </div>
              <p className="reliability-note">{t('analysis.reliabilityNote')}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="analysis-container">
      {/* Profile */}
      <div className="profile-section">
        <button className="profile-btn" onClick={() => setShowProfileModal(true)}>
          {t('analysis.profileBtn')} {userProfile.height_cm ? ' \u2713' : ''}
        </button>
        {profileSaved && <span className="saved-msg">\u2713 {t('common.saved')}</span>}
        {userProfile.height_cm && <span className="profile-info">{userProfile.height_cm}cm / {userProfile.weight_kg}kg</span>}
      </div>

      {/* Profile modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('analysis.profileTitle')}</h3>
            <p className="modal-desc">{t('analysis.profileDesc')}</p>
            <div className="form-row">
              <div className="form-group"><label>{t('analysis.height')}</label><input type="number" placeholder="175" value={userProfile.height_cm} onChange={(e) => setUserProfile({...userProfile, height_cm: e.target.value})} /></div>
              <div className="form-group"><label>{t('analysis.weight')}</label><input type="number" placeholder="70" value={userProfile.weight_kg} onChange={(e) => setUserProfile({...userProfile, weight_kg: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>{t('analysis.age')}</label><input type="number" placeholder="30" value={userProfile.age} onChange={(e) => setUserProfile({...userProfile, age: e.target.value})} /></div>
              <div className="form-group">
                <label>{t('analysis.gender')}</label>
                <select value={userProfile.gender} onChange={(e) => setUserProfile({...userProfile, gender: e.target.value})}>
                  <option value="">{t('analysis.genderSelect')}</option>
                  <option value="male">{t('analysis.male')}</option>
                  <option value="female">{t('analysis.female')}</option>
                </select>
              </div>
            </div>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setShowProfileModal(false)}>{t('common.cancel')}</button>
              <button className="btn-save" onClick={saveUserProfile}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Mode selector */}
      <div className="mode-selector">
        <button className={`mode-btn ${mode === 'single' ? 'active' : ''}`} onClick={() => { setMode('single'); setComparisonResult(null); setShowHistoryDetail(false); }}>{t('analysis.singleMode')}</button>
        <button className={`mode-btn ${mode === 'compare' ? 'active' : ''}`} onClick={() => { setMode('compare'); setAnalysisResult(null); setShowHistoryDetail(false); }}>{t('analysis.compareMode')}</button>
        <button className={`mode-btn ${mode === 'history' ? 'active' : ''}`} onClick={() => { setMode('history'); setAnalysisResult(null); setComparisonResult(null); setShowHistoryDetail(false); }}>{t('analysis.historyMode')}</button>
        <button className={`mode-btn ${mode === 'trend' ? 'active' : ''}`} onClick={() => { setMode('trend'); setAnalysisResult(null); setComparisonResult(null); setShowHistoryDetail(false); }}>{t('analysis.trendMode')}</button>
      </div>

      {/* TREND MODE */}
      {mode === 'trend' && (
        <div className="trend-section">
          <h3>{t('analysis.trendTitle')}</h3>
          {historyLoading ? (
            <div className="history-loading">{t('analysis.historyLoading')}</div>
          ) : buildTrendData().length < 2 ? (
            <div className="history-empty"><p>{t('analysis.trendNoData')}</p></div>
          ) : (
            <>
              <div className="chart-card">
                <h4>{t('analysis.trendOverallScore')}</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={buildTrendData()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={3} dot={{ r: 5, fill: '#7c3aed' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {buildTrendData().some(d => d.bodyFat) && (
                <div className="chart-card">
                  <h4>{t('analysis.trendBodyFat')}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={buildTrendData()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 40]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="bodyFat" stroke="#FF9800" strokeWidth={3} dot={{ r: 5, fill: '#FF9800' }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* HISTORY MODE */}
      {mode === 'history' && !showHistoryDetail && (
        <div className="history-section">
          <h3>{t('analysis.historyTitle')}</h3>
          {historyLoading ? <div className="history-loading">{t('analysis.historyLoading')}</div> : history.length === 0 ? (
            <div className="history-empty"><p>{t('analysis.historyEmpty')}</p><p>{t('analysis.historyEmptyHint')}</p></div>
          ) : (
            <div className="history-list">
              {history.map(item => (
                <div key={item.id} className="history-item" onClick={() => fetchHistoryDetail(item.id)}>
                  <div className="history-photos">
                    {(item.photos || []).slice(0, 2).map((p, idx) => (<img key={idx} src={p.url} alt="" className="history-thumb" />))}
                  </div>
                  <div className="history-info">
                    <div className="history-type">{item.analysis_type === 'compare' ? t('analysis.compareAnalysis') : t('analysis.singleAnalysis')}</div>
                    <div className="history-date">{formatDateTime(item.created_at)}</div>
                    <div className="history-score">
                      {item.overall_score && <span className="score-badge" style={{ backgroundColor: getScoreColor(item.overall_score / 10) }}>{item.overall_score}{t('analysis.score')}</span>}
                      {item.body_fat_percent && <span className="bf-badge">{t('analysis.bodyFat')} {item.body_fat_percent}%</span>}
                    </div>
                  </div>
                  <div className="history-arrow">&#8250;</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History detail header */}
      {showHistoryDetail && selectedHistory && (
        <div className="history-detail-header">
          <button className="back-btn" onClick={() => { setShowHistoryDetail(false); setAnalysisResult(null); setComparisonResult(null); }}>&#8592; {t('analysis.backToList')}</button>
          <span className="history-detail-date">{formatDateTime(selectedHistory.createdAt)}</span>
        </div>
      )}

      {/* Photo selection - Single */}
      {mode === 'single' && !showHistoryDetail && (
        <div className="photo-selection">
          <h3>{t('analysis.selectPhoto')}</h3>
          {photos.length === 0 ? <p className="no-photos">{t('analysis.noPhotos')}</p> : (
            <div className="photo-grid">
              {photos.map(p => (
                <div key={p.id} className={`photo-item ${selectedPhoto?.id === p.id ? 'selected' : ''}`} onClick={() => setSelectedPhoto(p)}>
                  <img src={p.photo_url} alt="" />
                  <span className="photo-date">{formatDate(p.taken_at)}</span>
                  {selectedPhoto?.id === p.id && <span className="selected-badge">{t('analysis.singleMode')}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo selection - Compare */}
      {mode === 'compare' && !showHistoryDetail && (
        <div className="photo-selection">
          <div className="compare-select">
            <div className="compare-col">
              <h3>{t('analysis.before')}</h3>
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
              <h3>{t('analysis.after')}</h3>
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

      {/* Action buttons */}
      {(mode === 'single' || mode === 'compare') && !showHistoryDetail && (
        <div className="action-btns">
          {mode === 'single' ? (
            <button className="analyze-btn" onClick={handleAnalyze} disabled={!selectedPhoto || loading}>
              {loading ? t('analysis.analyzing') : t('analysis.analyzeBtn')}
            </button>
          ) : (
            <button className="analyze-btn compare" onClick={handleCompare} disabled={!selectedPhoto || !comparePhoto || loading}>
              {loading ? t('analysis.comparing') : t('analysis.compareBtn')}
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner"></div>
            <p>{mode === 'single' ? t('analysis.aiAnalyzing') : t('analysis.aiComparing')}</p>
            <p className="loading-sub">{t('analysis.estimatedTime')}</p>
          </div>
        </div>
      )}

      {/* ===== SINGLE ANALYSIS RESULTS ===== */}
      {analysisResult && (
        <div className="analysis-result">
          <h2>{t('analysis.resultTitle')}</h2>

          {/* Photo conditions */}
          {analysisResult.photoConditions && (
            <div className="section conditions">
              <h3>{t('analysis.photoConditions')}</h3>
              <div className="cond-grid">
                <div className="cond-item"><span className="cond-label">{t('analysis.muscleState')}</span><span>{getCondLabel('muscleState', analysisResult.photoConditions.muscleState)}</span></div>
                <div className="cond-item"><span className="cond-label">{t('analysis.lighting')}</span><span>{getCondLabel('lighting', analysisResult.photoConditions.lighting)}</span></div>
                <div className="cond-item"><span className="cond-label">{t('analysis.distance')}</span><span>{getCondLabel('distance', analysisResult.photoConditions.distance)}</span></div>
                <div className="cond-item"><span className="cond-label">{t('analysis.reliability')}</span><ConfidenceBadge level={analysisResult.photoConditions.analysisReliability} /></div>
              </div>
              {analysisResult.photoConditions.analysisLimitations && <div className="limit-note">{analysisResult.photoConditions.analysisLimitations}</div>}
            </div>
          )}

          {/* Calibration */}
          {analysisResult.spatialCalibration && (
            <div className="section calibration">
              <h3>{t('analysis.calibration')}</h3>
              <div className="cal-grid">
                <span>{t('analysis.calibrationRef')} {analysisResult.spatialCalibration.primaryAnchor}</span>
                <ConfidenceBadge level={analysisResult.spatialCalibration.calibrationConfidence} />
              </div>
            </div>
          )}

          {/* Score card */}
          <div className="score-card">
            <div className="score-circle"><span className="score-num">{analysisResult.overallScore || '-'}</span><span className="score-label">/100</span></div>
            <div className="score-info">
              <h3>{analysisResult.bodyType} <ConfidenceBadge level={analysisResult.overallConfidence} /></h3>
              <p>{analysisResult.bodyTypeDescription}</p>
              {analysisResult.estimatedBodyFatPercent && <p className="bf-est">{t('analysis.bodyFatEst')} ~{analysisResult.estimatedBodyFatPercent}% <ConfidenceBadge level={analysisResult.bodyFatConfidence} /></p>}
            </div>
          </div>

          {/* RADAR CHART */}
          {analysisResult.muscleAnalysis && buildRadarData(analysisResult.muscleAnalysis).length > 0 && (
            <div className="section chart-section">
              <h3>{t('analysis.muscleTitle')}</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={buildRadarData(analysisResult.muscleAnalysis)} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#e0e0e0" />
                    <PolarAngleAxis dataKey="muscle" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* BAR CHART with reliability */}
          {analysisResult.muscleAnalysis && (
            <div className="section chart-section">
              <h3>{t('analysis.reliabilityTitle')}</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={buildBarData(analysisResult.muscleAnalysis)} layout="vertical" margin={{ left: 60, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="muscle" type="category" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {buildBarData(analysisResult.muscleAnalysis).map((entry, idx) => (
                        <Cell key={idx} fill={entry.visible ? getScoreColor(entry.score) : '#e0e0e0'} opacity={entry.visible ? 1 : 0.5} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Reliability indicator */}
          <ReliabilityIndicator muscleAnalysis={analysisResult.muscleAnalysis} />

          {/* Texture */}
          {analysisResult.textureAnalysis && (
            <div className="section texture">
              <h3>{t('analysis.textureTitle')}</h3>
              <div className="tex-grid">
                <div className="tex-item"><span>{t('analysis.definition')}</span><span>{analysisResult.textureAnalysis.overallDefinition}/10</span></div>
                <div className="tex-item"><span>{t('analysis.vascularity')}</span><span>{analysisResult.textureAnalysis.vascularity}</span></div>
                <div className="tex-item"><span>{t('analysis.skinFold')}</span><span>{analysisResult.textureAnalysis.skinFoldEstimate}</span></div>
              </div>
            </div>
          )}

          {/* Measurements */}
          {analysisResult.estimatedMeasurements && (
            <div className="section measurements">
              <h3>{t('analysis.measureTitle')}</h3>
              <div className="meas-grid">
                {analysisResult.estimatedMeasurements.shoulderWidth && <div className="meas-item"><span>{t('analysis.shoulder')}</span><span>{analysisResult.estimatedMeasurements.shoulderWidth}</span></div>}
                {analysisResult.estimatedMeasurements.chestCircumference && <div className="meas-item"><span>{t('analysis.chest')}</span><span>{analysisResult.estimatedMeasurements.chestCircumference}</span></div>}
                {analysisResult.estimatedMeasurements.waistCircumference && <div className="meas-item"><span>{t('analysis.waist')}</span><span>{analysisResult.estimatedMeasurements.waistCircumference}</span></div>}
                {analysisResult.estimatedMeasurements.armCircumference && <div className="meas-item"><span>{t('analysis.arm')}</span><span>{analysisResult.estimatedMeasurements.armCircumference}</span></div>}
                {analysisResult.estimatedMeasurements.thighCircumference && <div className="meas-item"><span>{t('analysis.thigh')}</span><span>{analysisResult.estimatedMeasurements.thighCircumference}</span></div>}
              </div>
            </div>
          )}

          {/* Detailed muscle list */}
          {analysisResult.muscleAnalysis && (
            <div className="section muscles">
              {analysisResult.muscleAnalysis.upperBody && (
                <div className="muscle-category"><h4>{t('analysis.upperBodyLabel')} ({t('analysis.overallLabel')} {analysisResult.muscleAnalysis.upperBody.overall || '-'}/10)</h4><div className="muscle-list">{MUSCLE_CATEGORIES.upperBody.map(m => renderMuscle(m, getMuscleData(analysisResult.muscleAnalysis.upperBody, m)))}</div></div>
              )}
              {analysisResult.muscleAnalysis.core && (
                <div className="muscle-category"><h4>{t('analysis.coreLabel')} ({t('analysis.overallLabel')} {analysisResult.muscleAnalysis.core.overall || '-'}/10)</h4><div className="muscle-list">{MUSCLE_CATEGORIES.core.map(m => renderMuscle(m, getMuscleData(analysisResult.muscleAnalysis.core, m)))}</div></div>
              )}
              {analysisResult.muscleAnalysis.lowerBody && (
                <div className="muscle-category"><h4>{t('analysis.lowerBodyLabel')} ({t('analysis.overallLabel')} {analysisResult.muscleAnalysis.lowerBody.overall || '-'}/10)</h4><div className="muscle-list">{MUSCLE_CATEGORIES.lowerBody.map(m => renderMuscle(m, getMuscleData(analysisResult.muscleAnalysis.lowerBody, m)))}</div></div>
              )}
            </div>
          )}

          {/* Weaknesses */}
          {analysisResult.weakestMuscles?.length > 0 && (
            <div className="section weak-points">
              <h3>{t('analysis.weakTitle')}</h3>
              {analysisResult.weakestMuscles.map((wp, idx) => (
                <div key={idx} className="weak-card">
                  <div className="weak-header" onClick={() => setExpandedMuscle(expandedMuscle === idx ? null : idx)}>
                    <span className="rank">{idx + 1}</span><span className="name">{wp.muscle}</span>
                    <span className="score" style={{ backgroundColor: getScoreColor(wp.score) }}>{wp.score}/10</span>
                    <span className="expand">{expandedMuscle === idx ? '\u25B2' : '\u25BC'}</span>
                  </div>
                  {expandedMuscle === idx && (
                    <div className="weak-detail">
                      <p className="reason">{wp.reason}</p>
                      {wp.exercises?.map((ex, i) => (<div key={i} className="exercise">{ex.name} - {ex.sets} x {ex.reps} | {ex.tip}</div>))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Strengths */}
          {analysisResult.strongestMuscles?.length > 0 && (
            <div className="section strong-points">
              <h3>{t('analysis.strongTitle')}</h3>
              {analysisResult.strongestMuscles.map((sp, idx) => (
                <div key={idx} className="strong-item">
                  <span className="name">{['\u{1F947}', '\u{1F948}', '\u{1F949}'][idx]} {sp.muscle}</span>
                  <span className="score" style={{ color: getScoreColor(sp.score) }}>{sp.score}/10</span>
                </div>
              ))}
            </div>
          )}

          {/* Weekly plan */}
          {analysisResult.recommendations?.weeklyPlan && (
            <div className="section plan">
              <h3>{t('analysis.weeklyPlan')}</h3>
              <div className="week-plan">
                {Object.entries(analysisResult.recommendations.weeklyPlan).map(([day, plan]) => (
                  <div key={day} className="day"><span className="day-name">{day.toUpperCase()}</span><span className="day-content">{plan}</span></div>
                ))}
              </div>
            </div>
          )}

          {analysisResult.summary && <div className="summary"><h3>{t('analysis.summaryTitle')}</h3><p>{analysisResult.summary}</p></div>}
          {analysisResult.analysisDisclaimer && <div className="disclaimer">{analysisResult.analysisDisclaimer}</div>}
        </div>
      )}

      {/* ===== COMPARISON RESULTS ===== */}
      {comparisonResult && (
        <div className="comparison-result">
          <h2>{t('analysis.compResultTitle')}</h2>

          {comparisonResult.photoConditions?.conditionMatch && (
            <div className="section condition-match">
              <h3>{t('analysis.conditionMatch')}</h3>
              <div className="match-display">
                <div className="match-circle" style={{ borderColor: comparisonResult.photoConditions.conditionMatch.overallMatchScore >= 70 ? '#4CAF50' : comparisonResult.photoConditions.conditionMatch.overallMatchScore >= 40 ? '#FF9800' : '#F44336' }}>
                  <span className="match-num">{comparisonResult.photoConditions.conditionMatch.overallMatchScore}</span><span className="match-label">%</span>
                </div>
                <div className="match-items">
                  <span className={comparisonResult.photoConditions.conditionMatch.muscleStateMatch ? 'ok' : 'no'}>{comparisonResult.photoConditions.conditionMatch.muscleStateMatch ? '\u2713' : '\u2717'} {t('analysis.muscleMatch')}</span>
                  <span className={comparisonResult.photoConditions.conditionMatch.lightingMatch ? 'ok' : 'no'}>{comparisonResult.photoConditions.conditionMatch.lightingMatch ? '\u2713' : '\u2717'} {t('analysis.lightingMatch')}</span>
                  <span className={comparisonResult.photoConditions.conditionMatch.distanceMatch ? 'ok' : 'no'}>{comparisonResult.photoConditions.conditionMatch.distanceMatch ? '\u2713' : '\u2717'} {t('analysis.distanceMatch')}</span>
                  <span className={comparisonResult.photoConditions.conditionMatch.angleMatch ? 'ok' : 'no'}>{comparisonResult.photoConditions.conditionMatch.angleMatch ? '\u2713' : '\u2717'} {t('analysis.angleMatch')}</span>
                </div>
              </div>
              <div className={`comp-warning ${comparisonResult.photoConditions.conditionMatch.overallComparability}`}>
                <span>{t('analysis.compReliability')} {comparisonResult.photoConditions.conditionMatch.overallComparability === 'high' ? t('analysis.compHigh') : comparisonResult.photoConditions.conditionMatch.overallComparability === 'medium' ? t('analysis.compMedium') : t('analysis.compLow')}</span>
                <p>{comparisonResult.photoConditions.conditionMatch.comparabilityExplanation}</p>
              </div>
            </div>
          )}

          {comparisonResult.timePeriod && (
            <div className="section time-period">
              <h3>{t('analysis.periodTitle')}</h3>
              <div className="period-info"><span className="days">{comparisonResult.timePeriod.daysBetween}{t('analysis.periodDays')}</span><p>{comparisonResult.timePeriod.realisticChangeExpectation}</p></div>
            </div>
          )}

          {comparisonResult.apparentVsRealChanges && (
            <div className="section avr">
              <h3>{t('analysis.apparentVsReal')}</h3>
              <div className="avr-grid">
                <div className="avr-item apparent"><h4>{t('analysis.apparentChanges')}</h4><p>{comparisonResult.apparentVsRealChanges.apparentChanges || t('analysis.noChange')}</p></div>
                <div className="avr-item real"><h4>{t('analysis.realChanges')}</h4><p>{comparisonResult.apparentVsRealChanges.realChanges || t('analysis.noChange')}</p></div>
              </div>
            </div>
          )}

          <div className="change-card">
            <div className="change-circle" style={{ backgroundColor: getChangeColor(comparisonResult.changeScore?.toString()) }}>
              <span className="change-num">{comparisonResult.changeScore > 0 ? '+' : ''}{comparisonResult.changeScore}</span>
            </div>
            <div className="change-info"><h3>{comparisonResult.overallChange} <ConfidenceBadge level={comparisonResult.changeConfidence} /></h3></div>
          </div>

          {comparisonResult.estimatedBodyFatChange && (
            <div className="section bf-change">
              <h3>{t('analysis.bodyFatChange')}</h3>
              <div className="bf-display">
                <span>{comparisonResult.estimatedBodyFatChange.before || '?'}%</span><span className="arrow">\u2192</span>
                <span style={{ color: getChangeColor(comparisonResult.estimatedBodyFatChange.changePercent) }}>{comparisonResult.estimatedBodyFatChange.after || '?'}%</span>
                <span style={{ color: getChangeColor(comparisonResult.estimatedBodyFatChange.changePercent) }}>({comparisonResult.estimatedBodyFatChange.changePercent || '?'})</span>
                <ConfidenceBadge level={comparisonResult.estimatedBodyFatChange.confidence} />
              </div>
            </div>
          )}

          {comparisonResult.muscleChanges && (
            <div className="section muscle-changes">
              <h3>{t('analysis.muscleChanges')}</h3>
              <div className="mc-grid">
                {Object.entries(comparisonResult.muscleChanges).map(([m, d]) => {
                  if (!d) return null;
                  return (
                    <div key={m} className={`mc-card ${!d.visibleInBoth ? 'na' : ''}`}>
                      <div className="mc-header"><span className="mc-name">{t(`analysis.muscles.${m}`)}</span><span className="mc-pct" style={{ color: getChangeColor(d.changePercent) }}>{d.changePercent || '0%'}</span></div>
                      <div className="mc-scores"><span>{d.before ?? '-'}</span><span>\u2192</span><span style={{ color: getChangeColor(d.changePercent) }}>{d.after ?? '-'}</span></div>
                      {!d.visibleInBoth && <p className="mc-na">{t('analysis.notComparable')}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {comparisonResult.topImproved?.length > 0 && (
            <div className="section top-improved">
              <h3>{t('analysis.topImproved')}</h3>
              {comparisonResult.topImproved.map((item, idx) => (
                <div key={idx} className="top-card">
                  <span className="rank">{['\u{1F947}', '\u{1F948}', '\u{1F949}'][idx]}</span><span className="name">{item.muscle}</span>
                  <span className="pct" style={{ color: '#4CAF50' }}>{item.changePercent}</span>
                  {item.isRealChange === false && <span className="tag">{t('analysis.conditionDiff')}</span>}
                </div>
              ))}
            </div>
          )}

          {comparisonResult.recommendations && (
            <div className="section recommendations">
              <h3>{t('analysis.recommendations')}</h3>
              {comparisonResult.recommendations.nextGoal && <p className="goal">{comparisonResult.recommendations.nextGoal}</p>}
              {comparisonResult.recommendations.photoTip && <p className="tip">{comparisonResult.recommendations.photoTip}</p>}
            </div>
          )}

          {comparisonResult.encouragement && <div className="encourage">{comparisonResult.encouragement}</div>}
          {comparisonResult.summary && <div className="summary"><h3>{t('analysis.summaryTitle')}</h3><p>{comparisonResult.summary}</p></div>}
          {comparisonResult.analysisDisclaimer && <div className="disclaimer">{comparisonResult.analysisDisclaimer}</div>}
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
