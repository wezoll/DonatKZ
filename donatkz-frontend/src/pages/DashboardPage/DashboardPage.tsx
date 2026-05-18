import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import DashboardSidebar from '../../components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader';
import ManagementPage from '../DashboardPages/ManagementPage/ManagementPage';
import TariffPage from '../DashboardPages/TariffPage/TariffPage';
import LastDonationsPage from '../DashboardPages/LastDonationsPage/LastDonationsPage';
import NewsPage from '../DashboardPages/NewsPage/NewsPage';
import GoalPage from '../DashboardPages/GoalPage/GoalPage';
import PaymentPage from '../DashboardPages/PaymentPage/PaymentPage';
import SupportPage from '../DashboardPages/SupportPage/SupportPage';
import StatisticsPage from '../DashboardPages/StatisticsPage/StatisticsPage';
import SettingsPage from '../DashboardPages/SettingsPage/SettingsPage';
import NotificationPage from '../DashboardPages/NotificationsPage/NotificationsPage';
import AdminPanel from '../DashboardPages/AdminPanel/AdminPanel';
import HotkeysPage from '../DashboardPages/HotkeysPage/HotkeysPage';
import RoulettePage from '../DashboardPages/RoulettePage/RoulettePage';
import VideoPage from '../DashboardPages/VideoPage/VideoPage';
import { userApi } from '../../api/user.api';
import { useAuth } from '../../context/AuthContext';

type ActivePage = 'management' | 'tariff' | 'payment' | 'last-donations' | 'news' | 'notifications' | 'goal' | 'statistics' | 'video' | 'hotkeys' | 'roulette' | 'settings' | 'support' | 'admin-panel';

const DashboardPage: React.FC = () => {
    const [activePage, setActivePage] = useState<ActivePage>('management');
    const [userName, setUserName] = useState('Загрузка...');
    const { user } = useAuth();

    useEffect(() => {
        userApi.getProfile()
            .then((profile) => {
                setUserName(profile.displayName || profile.username);
            })
            .catch((err) => {
                console.error('Failed to load user profile:', err);
                setUserName('Пользователь'); // Fallback
            });
    }, []);

    // Перенаправление, если пользователь не админ пытается открыть админ-панель
    useEffect(() => {
        if (activePage === 'admin-panel' && user && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            setActivePage('management');
        }
    }, [activePage, user]);

    const renderPage = () => {
        switch (activePage) {
            case 'management':
                return <ManagementPage />;
            case 'tariff':
                return <TariffPage onNavigateToPayment={(planId) => setActivePage('payment')} />;
            case 'payment':
                return <PaymentPage />;
            case 'last-donations':
                return <LastDonationsPage />;
            case 'news':
                return <NewsPage />;
            case 'notifications':
                return <NotificationPage />;
            case 'goal':
                return <GoalPage />;
            case 'statistics':
                return <StatisticsPage />;
            case 'video':
                return <VideoPage />;
            case 'hotkeys':
                return <HotkeysPage />;
            case 'roulette':
                return <RoulettePage />;
            case 'settings':
                return <SettingsPage />;
            case 'support':
                return <SupportPage />;
            case 'admin-panel':
                // Проверяем роль перед отображением админ-панели
                if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
                    return <AdminPanel />;
                } else {
                    // Если пользователь не админ, показываем управление
                    return <ManagementPage />;
                }
            default:
                return <ManagementPage />;
        }
    };

    return (
        <div className="dashboard-page">
            <DashboardSidebar activePage={activePage} onPageChange={setActivePage} />

            <div className="dashboard-main">
                <DashboardHeader userName={userName} currentPage={activePage} />

                <div className="dashboard-content">
                    {renderPage()}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;