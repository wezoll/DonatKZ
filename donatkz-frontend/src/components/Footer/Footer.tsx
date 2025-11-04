import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Footer.css';
import donatKzLogo from '../../assets/images/donatkz_logo.svg';
import windowsIcon from '../../assets/images/windows.png';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          const headerHeight = document.querySelector('header')?.offsetHeight || 0;
          const elementPosition = section.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerHeight;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 100);
    } else {
      const section = document.getElementById(sectionId);
      if (section) {
        const headerHeight = document.querySelector('header')?.offsetHeight || 0;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerHeight;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          {/* Секция с логотипом и соцсетями */}
          <div className="footer-section-logo">
            <div className="footer-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
              <img src={donatKzLogo} alt="DonatKZ" className="footer-logo-img" />
              <span className="footer-logo-text">DonatKZ</span>
            </div>
            <div className="footer-socials">
              <a href="#" className="social-btn" title="Telegram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.3 1.5L1.6 10.9c-1.2.5-1.2 1.6-.2 2l5.6 1.8 13-8.1c.6-.4 1.2-.2.7.4l-10.5 9.5c-.3.3-.5.8-.5 1.3l-.3 5.5c-.1.8.4 1.1 1 .7l2.5-2.3 5.1 3.8c.9.7 2 .3 2.2-1L23 2.8c.2-.8-.4-1.3-1.2-1.1z"/>
                </svg>
              </a>
              <a href="#" className="social-btn" title="Gmail">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
              <a href="#" className="social-btn" title="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Меню */}
          <div className="footer-section-menu">
            <h3 className="footer-section-title">МЕНЮ</h3>
            <nav className="footer-menu">
              <span 
                onClick={() => scrollToSection('hero')} 
                className="footer-menu-link"
              >
                ГЛАВНАЯ
              </span>
              <span 
                onClick={() => scrollToSection('tutorial')} 
                className="footer-menu-link"
              >
                ТУТОРИАЛ
              </span>
              <span 
                onClick={() => scrollToSection('reviews')} 
                className="footer-menu-link"
              >
                О НАС
              </span>
              <span 
                onClick={() => scrollToSection('contact')} 
                className="footer-menu-link"
              >
                КОНТАКТЫ
              </span>
              <span 
                onClick={() => scrollToSection('pricing')} 
                className="footer-menu-link"
              >
                ТАРИФЫ
              </span>
              <span 
                onClick={() => scrollToSection('faq')} 
                className="footer-menu-link"
              >
                FAQ
              </span>
            </nav>
          </div>

          {/* Скачать приложение */}
          <div className="footer-section-download">
            <h3 className="footer-section-title">СКАЧИВАЙ ПРИЛОЖЕНИЕ</h3>
            <button className="download-btn">
              <img src={windowsIcon} alt="Windows" className="windows-icon" />
              СКАЧАТЬ
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <p>Все права защищены</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;