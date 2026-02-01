import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

4. **"Commit new file"** 클릭

---

## 📂 **최종 파일 구조**
```
nunbody-frontend/
├── public/
│   └── index.html         ← 지금 만들기
├── src/
│   ├── components/        (이미 있음)
│   ├── pages/            (이미 있음)
│   ├── App.js            (이미 있음)
│   └── index.js          ← 지금 만들기
└── package.json          (방금 만듦 ✅)
