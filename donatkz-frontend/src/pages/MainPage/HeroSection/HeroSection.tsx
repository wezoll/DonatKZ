import React, { useRef } from 'react';
import './HeroSection.css';
import dashboardImg from '../../../assets/images/dashboard.png';
import windowsIcon from '../../../assets/images/windows.png';

const HeroSection: React.FC = () => {
  const headerRef = useRef<HTMLElement | null>(null);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const header = document.querySelector('header');
      const headerHeight = header?.offsetHeight || 0;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="hero-section" id="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          DonatKZ — донаты просто. Через Kaspi.
        </h1>

        <p className="hero-description">
          DonatKZ — платформа для стримеров и контент-креаторов, позволяющая принимать донаты напрямую через Kaspi с мгновенным отображением уведомлений на экране.
        </p>

        <div className="hero-buttons">
          <button className="btn-primary">
            <img src={windowsIcon} alt="Windows" className="windows-icon" />
            СКАЧАТЬ
          </button>
          <button className="btn-secondary" onClick={() => scrollToSection('pricing')}>
            ТАРИФЫ
          </button>
        </div>
      </div>

      <div className="hero-preview">
        <div className="hero-preview-content">
          <img src={dashboardImg} alt="Dashboard" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;