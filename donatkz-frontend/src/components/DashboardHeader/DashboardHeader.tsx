import React from 'react';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  userName: string;
  currentPage: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, currentPage }) => {
  const pageConfig: { [key: string]: { icon: string; title: string } } = {
    'management': { icon: '/icons/management-white.svg', title: 'Управление' },
    'tariff': { icon: '/icons/tariff-black.svg', title: 'Мой тариф' },
    'last-donations': { icon: '/icons/donations-white.svg', title: 'Последние донаты' },
    'news': { icon: '/icons/news-white.svg', title: 'Новости' },
    'notifications': { icon: '/icons/notifications-white.svg', title: 'Уведомления' },
    'goal': { icon: '/icons/goal-white.svg', title: 'Цель сбора' },
    'statistics': { icon: '/icons/statistics-white.svg', title: 'Статистика' },
    'video': { icon: '/icons/video-white.svg', title: 'Видео' },
    'hotkeys': { icon: '/icons/hotkeys-white.svg', title: 'Горячие клавиши' },
    'roulette': { icon: '/icons/roulette-white.svg', title: 'Рулетка' },
    'settings': { icon: '/icons/settings-white.svg', title: 'Настройки' },
    'support': { icon: '/icons/support-white.svg', title: 'Тех. поддержка' },
    'logout': { icon: '/icons/logout-icon-white.svg', title: 'Выход' },
  };

  const currentConfig = pageConfig[currentPage] || pageConfig['management'];

  const getInitials = (name: string): string => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  const toggleMenu = () => {
    console.log('Toggle mobile menu');
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleMenu} title="Меню">
          ≡
        </button>
      </div>

      <div className="header-title">
        <img
          src={currentConfig.icon}
          alt={currentConfig.title}
          className="title-icon"
        />
        <span className="title-text">{currentConfig.title}</span>
      </div>

      <div className="header-right">
        <span className="user-name">{userName}</span>
        <div className="user-avatar-1" title={userName}>
          {getInitials(userName)}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
