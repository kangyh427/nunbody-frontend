import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import { savePhotoLocal, fileToBlob } from '../utils/localDB';
import './PhotoUpload.css';

const PhotoUpload = ({ onUploadSuccess }) => {
  const { t } = useLanguage();
  // Multi-photo state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [bodyPart, setBodyPart] = useState('full');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [sessionId] = useState(() => Date.now().toString());

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(p => {
        if (p.url && p.url.startsWith('blob:')) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [previews]);

  // Cleanup camera on unmount
  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      if (videoEl && videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Multi-file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const totalCount = selectedFiles.length + files.length;
    if (totalCount > 10) {
      setError(t('upload.maxPhotos'));
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(t('upload.imageOnly'));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t('upload.maxSize'));
        return;
      }
      validFiles.push(file);
    }

    const newPreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    setError('');

    // Reset input value so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
      setError('');
    } catch (err) {
      setError(t('upload.cameraPermission'));
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(file);

      if (selectedFiles.length >= 10) {
        setError(t('upload.maxPhotos'));
        return;
      }

      setSelectedFiles(prev => [...prev, file]);
      setPreviews(prev => [...prev, { file, url, name: file.name }]);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  // Remove single photo from selection
  const removePhoto = (index) => {
    const removedPreview = previews[index];
    if (removedPreview.url.startsWith('blob:')) {
      URL.revokeObjectURL(removedPreview.url);
    }
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload all photos
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError(t('upload.selectPhoto'));
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      let uploaded = 0;

      for (const file of selectedFiles) {
        // Save to local IndexedDB first
        const blob = await fileToBlob(file);
        await savePhotoLocal({
          blob,
          fileName: file.name,
          bodyPart,
          sessionId,
          mimeType: file.type,
        });

        // Also upload to server for AI analysis
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('body_part', bodyPart);
        formData.append('session_id', sessionId);

        await api.post('/api/photos/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        uploaded++;
        setUploadProgress(Math.round((uploaded / selectedFiles.length) * 100));
      }

      // Cleanup
      previews.forEach(p => {
        if (p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
      });
      setSelectedFiles([]);
      setPreviews([]);

      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert(t('auth.sessionExpired'));
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setError(err.response?.data?.message || t('upload.uploadFailed'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Reset all
  const handleReset = () => {
    previews.forEach(p => {
      if (p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
    });
    setPreviews([]);
    setSelectedFiles([]);
  };

  return (
    <div className="photo-upload-container">
      <h2>{t('upload.multiTitle')}</h2>
      <p className="upload-desc">{t('upload.multiDesc')}</p>

      {/* Body part selector */}
      <div className="body-part-selector">
        <label>{t('upload.bodyPart')}</label>
        <div className="body-part-options">
          {['full', 'upper', 'lower'].map(part => (
            <button
              key={part}
              className={`body-part-btn ${bodyPart === part ? 'active' : ''}`}
              onClick={() => setBodyPart(part)}
            >
              {t(`upload.${part}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Upload options */}
      {!cameraActive && (
        <div className="upload-options">
          <button onClick={startCamera} className="btn-camera">
            {t('upload.camera')}
          </button>
          <button onClick={() => fileInputRef.current.click()} className="btn-file">
            {t('upload.gallery')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Camera view */}
      {cameraActive && (
        <div className="camera-view">
          <video ref={videoRef} autoPlay playsInline></video>
          <div className="camera-controls">
            <button onClick={capturePhoto} className="btn-capture">{t('upload.capture')}</button>
            <button onClick={stopCamera} className="btn-cancel">{t('common.cancel')}</button>
          </div>
        </div>
      )}

      {/* Multi-photo preview grid */}
      {previews.length > 0 && (
        <div className="multi-preview-section">
          <div className="preview-header">
            <span className="photo-count">
              {t('upload.photoCount').replace('{count}', previews.length)}
            </span>
            <button onClick={() => fileInputRef.current.click()} className="btn-add-more">
              + {t('upload.addMore')}
            </button>
          </div>

          <div className="multi-preview-grid">
            {previews.map((preview, index) => (
              <div key={index} className="preview-item">
                <img src={preview.url} alt={`Preview ${index + 1}`} />
                <button
                  className="remove-btn"
                  onClick={() => removePhoto(index)}
                  title={t('upload.removePhoto')}
                >
                  &times;
                </button>
                <span className="preview-number">{index + 1}</span>
              </div>
            ))}
          </div>

          <div className="preview-controls">
            <button onClick={handleUpload} disabled={uploading} className="btn-upload">
              {uploading
                ? `${t('upload.uploading')} ${uploadProgress}%`
                : `${t('upload.uploadAll')} (${previews.length})`
              }
            </button>
            <button onClick={handleReset} className="btn-cancel" disabled={uploading}>
              {t('upload.resetBtn')}
            </button>
          </div>

          {uploading && (
            <div className="upload-progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
        </div>
      )}

      {/* Privacy notice */}
      <div className="privacy-notice">
        <span className="lock-icon">&#128274;</span>
        {t('security.localOnly')}
      </div>

      {error && <div className="error-message">{String(error)}</div>}
    </div>
  );
};

export default PhotoUpload;
