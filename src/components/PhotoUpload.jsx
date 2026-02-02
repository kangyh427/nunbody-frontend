import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './PhotoUpload.css';

// 환경 변수에서 API URL 가져오기 (배포 환경 대응)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const PhotoUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [bodyPart, setBodyPart] = useState('full');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // 메모리 누수 방지: 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // 컴포넌트 언마운트 시 카메라 확실히 끄기
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 파일 선택
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다');
        return;
      }
      
      // 이전 미리보기 URL 정리
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // 전면 카메라 (selfie)
      });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
      setError('');
    } catch (err) {
      setError('카메라 접근 권한이 필요합니다');
      console.error('Camera error:', err);
    }
  };

  // 사진 촬영
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // 비디오의 실제 해상도로 설정 (모바일 대응)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // 이전 미리보기 URL 정리
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  // 카메라 중지
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  // 업로드
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('사진을 선택해주세요');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('body_part', bodyPart);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/photos/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        alert('사진이 업로드되었습니다!');
        
        // 미리보기 URL 정리
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
        
        setSelectedFile(null);
        setPreview(null);
        if (onUploadSuccess) onUploadSuccess(response.data.photo);
      }
    } catch (err) {
      // 401 에러 처리 (토큰 만료)
      if (err.response && err.response.status === 401) {
        alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setError(err.response?.data?.error || '업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  };

  // 다시 선택
  const handleReset = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="photo-upload-container">
      <h2>📸 사진 촬영/업로드</h2>

      {/* 촬영 부위 선택 */}
      <div className="body-part-selector">
        <label>촬영 부위:</label>
        <select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
          <option value="full">전신</option>
          <option value="upper">상체</option>
          <option value="lower">하체</option>
        </select>
      </div>

      {/* 카메라 또는 파일 선택 */}
      {!cameraActive && !preview && (
        <div className="upload-options">
          <button onClick={startCamera} className="btn-camera">
            📷 카메라로 촬영
          </button>
          <button onClick={() => fileInputRef.current.click()} className="btn-file">
            🖼️ 갤러리에서 선택
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* 카메라 뷰 */}
      {cameraActive && (
        <div className="camera-view">
          <video ref={videoRef} autoPlay playsInline></video>
          <div className="camera-controls">
            <button onClick={capturePhoto} className="btn-capture">촬영</button>
            <button onClick={stopCamera} className="btn-cancel">취소</button>
          </div>
        </div>
      )}

      {/* 미리보기 */}
      {preview && (
        <div className="preview-section">
          <img src={preview} alt="Preview" />
          <div className="preview-controls">
            <button onClick={handleUpload} disabled={uploading} className="btn-upload">
              {uploading ? '업로드 중...' : '✅ 업로드'}
            </button>
            <button onClick={handleReset} className="btn-cancel">
              다시 선택
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default PhotoUpload;
