import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PhotoGallery.css';

const PhotoGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // 사진 목록 불러오기
  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:3000/api/photos/my-photos',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setPhotos(response.data.photos);
      }
    } catch (err) {
      setError('사진 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  // 사진 삭제
  const deletePhoto = async (photoId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3000/api/photos/${photoId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setPhotos(photos.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
      alert('사진이 삭제되었습니다');
    } catch (err) {
      alert('삭제에 실패했습니다');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 부위 한글 변환
  const getBodyPartText = (bodyPart) => {
    const parts = {
      'full': '전신',
      'upper': '상체',
      'lower': '하체'
    };
    return parts[bodyPart] || bodyPart;
  };

  if (loading) {
    return <div className="loading">사진을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="photo-gallery-container">
      <h2>📂 내 사진 ({photos.length}장)</h2>

      {photos.length === 0 ? (
        <div className="empty-state">
          <p>아직 업로드한 사진이 없습니다</p>
          <p>첫 번째 사진을 촬영해보세요! 📸</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="photo-card"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img src={photo.photo_url} alt={`${photo.body_part} 사진`} />
              <div className="photo-info">
                <span className="body-part-badge">{getBodyPartText(photo.body_part)}</span>
                <span className="photo-date">{formatDate(photo.taken_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 사진 상세 모달 */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPhoto(null)}>✕</button>
            <img src={selectedPhoto.photo_url} alt="상세 사진" />
            <div className="modal-info">
              <h3>{getBodyPartText(selectedPhoto.body_part)} 사진</h3>
              <p>촬영일: {formatDate(selectedPhoto.taken_at)}</p>
              <div className="modal-actions">
                <button 
                  className="btn-delete" 
                  onClick={() => deletePhoto(selectedPhoto.id)}
                >
                  🗑️ 삭제
                </button>
                <button 
                  className="btn-download"
                  onClick={() => window.open(selectedPhoto.photo_url, '_blank')}
                >
                  ⬇️ 다운로드
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
