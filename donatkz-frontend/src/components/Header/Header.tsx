import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';
import donatKzLogo from '../../assets/images/donatkz_logo.svg';
import windowsIcon from '../../assets/images/windows.png';

interface HeaderProps {
    onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
    const headerRef = useRef<HTMLElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Закрытие dropdown при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        const handleScroll = () => {
            const header = headerRef.current;
            if (!header) return;

            if (window.scrollY > 50) {
                header.classList.add('shrink');
            } else {
                header.classList.remove('shrink');
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId: string) => {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = headerRef.current?.offsetHeight || 0;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    };

    const handleNavClick = (path: string, sectionId?: string) => {
        if (location.pathname === '/' && sectionId) {
            scrollToSection(sectionId);
        } else {
            navigate(path);
            if (sectionId) {
                setTimeout(() => scrollToSection(sectionId), 100);
            }
        }
    };

    const handleLogoClick = () => {
        if (location.pathname !== '/') {
            navigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            scrollToSection('hero');
        }
    };

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate('/');
    };

    const handleDashboard = () => {
        setIsDropdownOpen(false);
        navigate('/dashboard');
    };

    const getInitials = (name: string): string => {
        const words = name.trim().split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <header className="header" ref={headerRef}>
            <div className="header-container">
                <div className="header-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                    <img src={donatKzLogo} alt="DonatKZ" className="logo-img" />
                    <span className="logo-text">DonatKZ</span>
                </div>

                <nav className="header-nav">
                    <button
                        onClick={() => handleNavClick('/', 'main')}
                        className="nav-link"
                    >
                        ГЛАВНАЯ
                    </button>
                    <button
                        onClick={() => handleNavClick('/', 'reviews')}
                        className="nav-link"
                    >
                        О НАС
                    </button>
                    <button
                        onClick={() => handleNavClick('/', 'pricing')}
                        className="nav-link"
                    >
                        ТАРИФЫ
                    </button>
                    <button
                        onClick={() => handleNavClick('/', 'tutorial')}
                        className="nav-link"
                    >
                        ТУТОРИАЛ
                    </button>
                    <button
                        onClick={() => handleNavClick('/', 'contact')}
                        className="nav-link"
                    >
                        КОНТАКТЫ
                    </button>
                    <button
                        onClick={() => handleNavClick('/', 'faq')}
                        className="nav-link"
                    >
                        FAQ
                    </button>
                </nav>

                <div className="header-actions">
                    {isAuthenticated && user ? (
                        <div className="user-profile-container" ref={dropdownRef}>
                            <div
                                className="user-avatar-1"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                <span className="avatar-initials">
                  {getInitials(user.displayName || user.username)}
                </span>
                            </div>

                            {isDropdownOpen && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <div className="dropdown-user-info">
                                            <div className="dropdown-name">{user.displayName || user.username}</div>
                                            <div className="dropdown-email">{user.email}</div>
                                            <div className="dropdown-tier">{user.subscriptionTier}</div>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item" onClick={handleDashboard}>
                                        <img src="/icons/management-icon.svg" alt="Dashboard" className="dropdown-icon" />
                                        Панель управления
                                    </button>
                                    <button className="dropdown-item" onClick={() => {
                                        setIsDropdownOpen(false);
                                        navigate('/dashboard');
                                        // TODO: переключить на страницу настроек
                                    }}>
                                        <img src="/icons/settings-icon.svg" alt="Settings" className="dropdown-icon" />
                                        Настройки
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout" onClick={handleLogout}>
                                        <img src="/icons/logout-icon.svg" alt="Logout" className="dropdown-icon" />
                                        Выйти
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            className="btn btn-login"
                            onClick={onLoginClick}
                        >
                            ВОЙТИ
                        </button>
                    )}

                    <button className="btn btn-download">
                        <img src={windowsIcon} alt="Windows" className="windows-icon" />
                        СКАЧАТЬ
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;