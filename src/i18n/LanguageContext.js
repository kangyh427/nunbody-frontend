import React, { createContext, useContext, useState, useCallback } from 'react';
import ko from './ko';
import en from './en';

const translations = { ko, en };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('nunbody-lang') || 'ko';
  });

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'ko' ? 'en' : 'ko';
      localStorage.setItem('nunbody-lang', next);
      return next;
    });
  }, []);

  const t = useCallback((path) => {
    const keys = path.split('.');
    let value = translations[language];
    for (const key of keys) {
      value = value?.[key];
    }
    return value || path;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
