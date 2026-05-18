// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header/Header';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import HeroSection from './pages/MainPage/HeroSection/HeroSection';
import ReviewsSection from './pages/MainPage/ReviewsSection/ReviewsSection';
import PricingSection from './pages/MainPage/PricingSection/PricingSection';
import OverviewSection from './pages/MainPage/OverviewSection/OverviewSection';
import TutorialSection from './pages/MainPage/TutorialSection/TutorialSection';
import ContactSection from './pages/MainPage/ContactSection/ContactSection';
import FaqSection from './pages/MainPage/FaqSection/FaqSection';
import Footer from './components/Footer/Footer';
import AuthPage from './pages/AuthPage/AuthPage';
import TermsPrivacyPage from './pages/TermsPrivacyPage/TermsPrivacyPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import WidgetPage from './pages/WidgetPage/WidgetPage';
import GoalWidgetPage from './pages/GoalWidgetPage/GoalWidgetPage';
import StatisticsWidgetPage from './pages/StatisticsWidgetPage/StatisticsWidgetPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import './App.css';

// Protected Route Component
interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    return <>{children}</>;
};

// Main Content Component
function MainContent() {
    const { isAuthenticated } = useAuth();

    const handleLoginClick = () => {
        window.location.href = '/auth/login';
    };

    return (
        <>
            <Header onLoginClick={handleLoginClick} />
            <main>
                <HeroSection />
                <ReviewsSection />
                <OverviewSection />
                <PricingSection onAuthRequired={handleLoginClick} />
                <TutorialSection />
                <ContactSection />
                <FaqSection />
            </main>
            <Footer />
            <ScrollToTop />
        </>
    );
}

function AppContent() {
    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<MainContent />} />

                <Route
                    path="/auth/login"
                    element={
                        <AuthPage
                            isRegister={false}
                            onBack={() => window.history.back()}
                            onTermsClick={() => window.location.href = '/terms'}
                        />
                    }
                />

                <Route
                    path="/auth/register"
                    element={
                        <AuthPage
                            isRegister={true}
                            onBack={() => window.history.back()}
                            onTermsClick={() => window.location.href = '/terms'}
                        />
                    }
                />

                <Route
                    path="/terms"
                    element={
                        <TermsPrivacyPage
                            onBack={() => window.history.back()}
                        />
                    }
                />

                {/* Widgets - публичные роуты (для OBS) */}
                <Route
                    path="/widget/:apiKey"
                    element={<WidgetPage />}
                />
                <Route
                    path="/goal-widget/:apiKey/:id"
                    element={<GoalWidgetPage />}
                />
                <Route
                    path="/statistics-widget/:apiKey/:id"
                    element={<StatisticsWidgetPage />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />

                {/* Protected Route - только для авторизованных */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;