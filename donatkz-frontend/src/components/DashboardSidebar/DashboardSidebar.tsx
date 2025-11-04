import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardSidebar.css';
import donatKzLogo from '../../assets/images/donatkz_logo.svg';
import { useAuth } from '../../context/AuthContext';

interface DashboardSidebarProps {
  activePage: string;
  onPageChange: (page: any) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ activePage, onPageChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isWidgetsOpen, setIsWidgetsOpen] = useState(true);
  const [isCabinetOpen, setIsCabinetOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Проверка роли администратора
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const mainItems = [
    { id: 'management', label: 'Управление', icon: 'icons/management-icon.svg', iconActive: 'icons/management-white.svg' },
    { id: 'tariff', label: 'Мой тариф', icon: 'icons/tariff-icon.svg', iconActive: 'icons/tariff-white.svg' },
    { id: 'last-donations', label: 'Последние донаты', icon: 'icons/donations-icon.svg', iconActive: 'icons/donations-white.svg' },
    { id: 'news', label: 'Новости', icon: 'icons/news-icon.svg', iconActive: 'icons/news-white.svg' },
  ];

  const widgetsItems = [
    { id: 'notifications', label: 'Уведомления', icon: 'icons/notifications-icon.svg', iconActive: 'icons/notifications-white.svg' },
    { id: 'goal', label: 'Цель сбора', icon: 'icons/goal-icon.svg', iconActive: 'icons/goal-white.svg' },
    { id: 'statistics', label: 'Статистика', icon: 'icons/statistics-icon.svg', iconActive: 'icons/statistics-white.svg' },
    { id: 'video', label: 'Видео', icon: 'icons/video-icon.svg', iconActive: 'icons/video-white.svg' },
    { id: 'hotkeys', label: 'Горячие клавиши', icon: 'icons/hotkeys-icon.svg', iconActive: 'icons/hotkeys-white.svg' },
    { id: 'roulette', label: 'Рулетка', icon: 'icons/roulette-icon.svg', iconActive: 'icons/roulette-white.svg' },
  ];

  const cabinetItems = [
    { id: 'settings', label: 'Настройки', icon: 'icons/settings-icon.svg', iconActive: 'icons/settings-white.svg' },
    { id: 'support', label: 'Тех. поддержка', icon: 'icons/support-icon.svg', iconActive: 'icons/support-white.svg' },
  ];

  const adminItems = [
    { id: 'admin-panel', label: 'Админ-панель', icon: 'icons/admin-icon.svg', iconActive: 'icons/admin-white.svg' },
  ];

  const handleLogout = () => {
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Добавляем класс к body для управления отступом контента
    document.body.classList.toggle('sidebar-collapsed');
  };

  return (
    <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo" onClick={isCollapsed ? toggleSidebar : undefined}>
        <img src={donatKzLogo} alt="DonatKZ" className="logo-image" />
        {!isCollapsed && <span className="logo-text">DonatKZ</span>}
        {!isCollapsed && (
          <button 
            className="menu-toggle" 
            onClick={toggleSidebar}
            aria-label="Свернуть меню"
          >
            ☰
          </button>
        )}
      </div>

      {!isCollapsed && (
        <button 
          className="sidebar-section-title"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          Панель управления {isPanelOpen ? '▼' : '▶'}
        </button>
      )}

      {isPanelOpen && (
        <nav className="sidebar-nav">
          <div className="nav-section">
            {mainItems.map(item => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <img 
                  src={activePage === item.id ? item.iconActive : item.icon} 
                  alt={item.label}
                  className="nav-icon-img"
                />
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>
      )}

      {!isCollapsed && (
        <button 
          className="sidebar-section-title"
          onClick={() => setIsWidgetsOpen(!isWidgetsOpen)}
        >
          Виджеты {isWidgetsOpen ? '▼' : '▶'}
        </button>
      )}

      {isWidgetsOpen && (
        <nav className="sidebar-nav">
          <div className="nav-section">
            {widgetsItems.map(item => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <img 
                  src={activePage === item.id ? item.iconActive : item.icon} 
                  alt={item.label}
                  className="nav-icon-img"
                />
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>
      )}

      {!isCollapsed && (
        <button 
          className="sidebar-section-title"
          onClick={() => setIsCabinetOpen(!isCabinetOpen)}
        >
          Кабинет {isCabinetOpen ? '▼' : '▶'}
        </button>
      )}

      {isCabinetOpen && (
        <nav className="sidebar-nav">
          <div className="nav-section">
            {cabinetItems.map(item => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <img 
                  src={activePage === item.id ? item.iconActive : item.icon} 
                  alt={item.label}
                  className="nav-icon-img"
                />
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Админ-панель (только для админов) */}
      {isAdmin && (
        <>
          {!isCollapsed && (
            <button 
              className="sidebar-section-title admin-section"
              onClick={() => setIsAdminOpen(!isAdminOpen)}
            >
              Администрирование {isAdminOpen ? '▼' : '▶'}
            </button>
          )}

          {isAdminOpen && (
            <nav className="sidebar-nav">
              <div className="nav-section">
                {adminItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`nav-item admin-item ${activePage === item.id ? 'active' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <img 
                      src={activePage === item.id ? item.iconActive : item.icon} 
                      alt={item.label}
                      className="nav-icon-img"
                    />
                    {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  </button>
                ))}
              </div>
            </nav>
          )}
        </>
      )}

      <button 
        onClick={handleLogout} 
        className="nav-item logout"
        title={isCollapsed ? 'Выйти' : ''}
      >
        <img 
          src="/icons/logout-icon.svg" 
          alt="Выйти"
          className="nav-icon-img"
        />
        {!isCollapsed && <span className="nav-label">Выйти</span>}
      </button>
    </aside>
  );
};

export default DashboardSidebar;