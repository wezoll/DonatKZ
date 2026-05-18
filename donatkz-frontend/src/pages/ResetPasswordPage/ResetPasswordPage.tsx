// src/pages/ResetPasswordPage/ResetPasswordPage.tsx

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import '../AuthPage/AuthPage.css';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        if (!token) {
            setError('Недействительный токен. Запросите сброс пароля заново.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await authApi.resetPassword(token, newPassword, confirmPassword);
            setSuccess(true);
            setTimeout(() => navigate('/auth/login'), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Произошла ошибка. Ссылка устарела или недействительна.');
        } finally {
            setIsLoading(false);
        }
    };

    const EyeIcon = ({ open }: { open: boolean }) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {open ? (
                <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            ) : (
                <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                </>
            )}
        </svg>
    );

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    {success ? (
                        <>
                            <h2 className="auth-title">Готово!</h2>
                            <div className="email-verification-notice">
                                <div className="email-verification-notice-content">
                                    <div className="email-verification-notice-icon">✅</div>
                                    <div className="email-verification-notice-text">
                                        <h3 className="email-verification-notice-title">Пароль изменён</h3>
                                        <p className="email-verification-notice-description">
                                            Ваш пароль успешно изменён. Сейчас вы будете перенаправлены на страницу входа...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <h2 className="auth-title">Новый пароль</h2>

                            {!token && (
                                <div className="error-message">
                                    Недействительная ссылка. Пожалуйста, запросите сброс пароля заново.
                                </div>
                            )}

                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label>Новый пароль</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Придумайте новый пароль"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        disabled={!token}
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setShowNew(!showNew)}>
                                        <EyeIcon open={showNew} />
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Подтвердите пароль</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Повторите пароль"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={!token}
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                                        <EyeIcon open={showConfirm} />
                                    </button>
                                </div>
                            </div>

                            {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                <p className="error-message">Пароли не совпадают</p>
                            )}

                            <button
                                type="submit"
                                className="btn-auth-submit"
                                disabled={isLoading || !token || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                            >
                                {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
                            </button>

                            <div className="auth-links">
                                <p>
                                    <button type="button" className="link-btn" onClick={() => navigate('/auth/login')}>
                                        Вернуться к авторизации
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
