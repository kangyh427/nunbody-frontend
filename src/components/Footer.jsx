import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-company">
            <div className="footer-logo">{t('common.appName')}</div>
            <div className="footer-company-info">
              {t('footer.companyName')}<br />
              {t('footer.ceo')}<br />
              {t('footer.businessNumber')}<br />
              {t('footer.address')}
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-links-title">{t('footer.customerService')}</div>
            <ul className="footer-links-list">
              <li>
                <button className="footer-link" onClick={() => navigate('/support')}>
                  {t('footer.customerService')}
                </button>
              </li>
              <li>
                <div className="footer-cs-email">
                  &#9993; {t('footer.csEmail')}
                </div>
              </li>
              <li>
                <div className="footer-cs-hours">{t('footer.csHours')}</div>
              </li>
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <span className="footer-copyright">{t('footer.copyright')}</span>
          <div className="footer-legal">
            <button className="footer-legal-link">{t('footer.privacyPolicy')}</button>
            <button className="footer-legal-link">{t('footer.termsOfService')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
