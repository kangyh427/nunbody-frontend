import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import { getAllPhotos, deletePhotoLocal } from '../utils/localDB';
import './PhotoGallery.css';

const PhotoGallery = () => {
  const { t, language } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const response = await api.get('/api/photos/my-photos');

      let serverPhotos = [];
      if (response.data.success) {
        serverPhotos = response.data.photos.map(p => ({ ...p, source: 'server' }));
      }

      // Also fetch local photos from IndexedDB
      let localPhotos = [];
      try {
        const localData = await getAllPhotos();
        localPhotos = localData.map(p => ({
          id: `local-${p.id}`,
          localId: p.id,
          photo_url: p.photo_url,
          body_part: p.bodyPart,
          taken_at: p.takenAt,
          session_id: p.sessionId,
          source: 'local',
        }));
      } catch (localErr) {
        console.warn('Local DB read failed:', localErr);
      }

      // Merge and sort by date
      const allPhotos = [...serverPhotos, ...localPhotos]
        .sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at));

      setPhotos(allPhotos);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert(t('auth.sessionExpired'));
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setError(t('gallery.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const deletePhoto = async (photo) => {
    if (!window.confirm(t('gallery.deleteConfirm'))) return;

    try {
      if (photo.source === 'local') {
        await deletePhotoLocal(photo.localId);
      } else {
        await api.delete(`/api/photos/${photo.id}`);
      }

      setPhotos(photos.filter(p => p.id !== photo.id));
      setSelectedPhoto(null);
      alert(t('gallery.deleted'));
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert(t('auth.sessionExpired'));
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      alert(t('gallery.deleteFailed'));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = language === 'ko' ? 'ko-KR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBodyPartText = (bodyPart) => {
    return t(`upload.${bodyPart}`) || bodyPart;
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="error-message">{String(error)}</div>;
  }

  return (
    <div className="photo-gallery-container">
      <h2>{t('gallery.title')} ({t('gallery.photoCount').replace('{count}', photos.length)})</h2>

      {photos.length === 0 ? (
        <div className="empty-state">
          <p>{t('gallery.empty')}</p>
          <p>{t('gallery.emptyHint')}</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="photo-card"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img src={photo.photo_url} alt={photo.body_part} />
              <div className="photo-info">
                <span className="body-part-badge">{getBodyPartText(photo.body_part)}</span>
                <span className="photo-date">{formatDate(photo.taken_at)}</span>
              </div>
              {photo.source === 'local' && (
                <div className="local-badge">
                  <span>&#128274;</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo detail modal */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPhoto(null)}>&times;</button>
            <img src={selectedPhoto.photo_url} alt="" />
            <div className="modal-info">
              <h3>{t('gallery.detailTitle').replace('{bodyPart}', getBodyPartText(selectedPhoto.body_part))}</h3>
              <p>{t('gallery.takenAt')} {formatDate(selectedPhoto.taken_at)}</p>
              {selectedPhoto.source === 'local' && (
                <p className="local-notice">
                  <span>&#128274;</span> {t('gallery.storedLocally')}
                </p>
              )}
              <div className="modal-actions">
                <button
                  className="btn-delete"
                  onClick={() => deletePhoto(selectedPhoto)}
                >
                  {t('common.delete')}
                </button>
                {selectedPhoto.source === 'server' && (
                  <button
                    className="btn-download"
                    onClick={() => window.open(selectedPhoto.photo_url, '_blank')}
                  >
                    {t('common.download')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
