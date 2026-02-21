// IndexedDB wrapper for local photo storage
// Photos are stored ONLY on the user's device for privacy

const DB_NAME = 'nunbody-photos';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('sessionId', 'sessionId', { unique: false });
        store.createIndex('takenAt', 'takenAt', { unique: false });
        store.createIndex('bodyPart', 'bodyPart', { unique: false });
      }
    };
  });
}

// Save a photo locally
export async function savePhotoLocal(photoData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record = {
      blob: photoData.blob,
      fileName: photoData.fileName,
      bodyPart: photoData.bodyPart || 'full',
      sessionId: photoData.sessionId || Date.now().toString(),
      takenAt: photoData.takenAt || new Date().toISOString(),
      mimeType: photoData.mimeType || 'image/jpeg',
    };
    const request = store.add(record);
    request.onsuccess = () => resolve({ ...record, id: request.result });
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// Get all photos
export async function getAllPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const photos = request.result.map(photo => ({
        ...photo,
        photo_url: URL.createObjectURL(photo.blob),
      }));
      resolve(photos.sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt)));
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// Get photo by ID
export async function getPhotoById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result) {
        resolve({
          ...request.result,
          photo_url: URL.createObjectURL(request.result.blob),
        });
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// Get photos by session
export async function getPhotosBySession(sessionId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('sessionId');
    const request = index.getAll(sessionId);
    request.onsuccess = () => {
      const photos = request.result.map(photo => ({
        ...photo,
        photo_url: URL.createObjectURL(photo.blob),
      }));
      resolve(photos);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// Delete a photo
export async function deletePhotoLocal(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// Get photo count
export async function getPhotoCount() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// Convert File to storable blob
export function fileToBlob(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Blob([reader.result], { type: file.type }));
    };
    reader.readAsArrayBuffer(file);
  });
}
