// src/pages/AuthPage/AuthPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPage.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

interface AuthPageProps {
    isRegister: boolean;
    onBack: () => void;
    onTermsClick?: () => void;
    onNavigateToSection?: (sectionId: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({
                                               isRegister: initialIsRegister,
                                               onBack,
                                               onTermsClick,
                                               onNavigateToSection
                                           }) => {
    const navigate = useNavigate();
    const { login, register, error, clearError, isLoading } = useAuth();

    const [isRegister, setIsRegister] = useState(initialIsRegister);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [forgotStep, setForgotStep] = useState<'email' | 'password' | null>(null);

    // Уведомление о проверке email
    const [showEmailVerificationNotice, setShowEmailVerificationNotice] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    // Login form
    const [loginData, setLoginData] = useState({ login: '', password: '' });

    // Register form
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        passwordConfirm: '',
        channelUrl: '',
        agreeTerms: false,
    });

    // Password reset
    const [resetEmail, setResetEmail] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);

    // Переключение между login/register
    const handleToggleMode = () => {
        setIsRegister(!isRegister);
        clearError();
        setShowEmailVerificationNotice(false);
        setLoginData({ login: '', password: '' });
        setRegisterData({
            username: '',
            email: '',
            password: '',
            passwordConfirm: '',
            channelUrl: '',
            agreeTerms: false,
        });
    };

    // Автоматически скрывать уведомление через 10 секунд
    React.useEffect(() => {
        if (showEmailVerificationNotice) {
            const timer = setTimeout(() => {
                setShowEmailVerificationNotice(false);
            }, 10000); // 10 секунд

            return () => clearTimeout(timer);
        }
    }, [showEmailVerificationNotice]);

    // Login submit
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login(loginData);
            navigate('/dashboard'); // Перенаправляем в дашборд после успешного входа
        } catch (err) {
            // Ошибка уже обработана в AuthContext
            console.error('Login failed:', err);
        }
    };

    // Register submit
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        // Валидация
        if (registerData.password !== registerData.passwordConfirm) {
            alert('Пароли не совпадают!');
            return;
        }

        if (!registerData.agreeTerms) {
            alert('Необходимо согласиться с условиями использования');
            return;
        }

        try {
            await register({
                username: registerData.username,
                email: registerData.email,
                password: registerData.password,
                confirmPassword: registerData.passwordConfirm,
                channelUrl: registerData.channelUrl || undefined,
            });

            // ПРАВИЛЬНАЯ ЛОГИКА: НЕ логиним автоматически!
            // Показываем уведомление о проверке email
            setRegisteredEmail(registerData.email);
            setShowEmailVerificationNotice(true);
            setIsRegister(false); // Переключаем на форму входа

            // Очищаем форму регистрации
            setRegisterData({
                username: '',
                email: '',
                password: '',
                passwordConfirm: '',
                channelUrl: '',
                agreeTerms: false,
            });

        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    const handleForgotPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (forgotStep === 'email' && resetEmail) {
            // TODO: Отправить запрос на восстановление пароля
            setForgotStep('password');
        } else if (forgotStep === 'password' && resetPassword === resetPasswordConfirm && resetPassword) {
            // TODO: Отправить новый пароль
            alert('Пароль успешно изменен!');
            setForgotStep(null);
            setResetEmail('');
            setResetPassword('');
            setResetPasswordConfirm('');
        }
    };

    return (
        <>
            <Header
                onLoginClick={() => {}}
                onPricingClick={() => {}}
                onHomeClick={onBack}
                isAuthPage={true}
                onNavigateToSection={onNavigateToSection}
            />
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        {forgotStep === null ? (
                            <>
                                <h2 className="auth-title">
                                    {isRegister ? 'Регистрация' : 'Авторизация'}
                                </h2>

                                {/* Уведомление о проверке email */}
                                {showEmailVerificationNotice && !isRegister && (
                                    <div className="email-verification-notice">
                                        <div className="email-verification-notice-content">
                                            <div className="email-verification-notice-icon">✉️</div>
                                            <div className="email-verification-notice-text">
                                                <h3 className="email-verification-notice-title">
                                                    Проверьте вашу почту!
                                                </h3>
                                                <p className="email-verification-notice-description">
                                                    Мы отправили письмо с ссылкой для подтверждения на:
                                                </p>
                                                <div className="email-verification-notice-email">
                                                    {registeredEmail}
                                                </div>
                                                <p className="email-verification-notice-tip">
                                                    📌 Перейдите по ссылке в письме, чтобы активировать аккаунт и войти в систему.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Показать ошибку если есть */}
                                {error && (
                                    <div className="error-message">
                                         {error}
                                    </div>
                                )}

                                {!isRegister ? (
                                    // Форма авторизации
                                    <form className="auth-form" onSubmit={handleLoginSubmit}>
                                        <div className="form-group">
                                            <label>Логин или Email</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Введите ваш логин или email"
                                                value={loginData.login}
                                                onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <div className="form-label-row">
                                                <label>Пароль</label>
                                                <button
                                                    type="button"
                                                    className="forgot-btn"
                                                    onClick={(e) => { e.preventDefault(); setForgotStep('email'); }}
                                                >
                                                    Забыли пароль?
                                                </button>
                                            </div>
                                            <div className="password-input-wrapper">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="form-input"
                                                    placeholder="Введите ваш пароль"
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        {showPassword ? (
                                                            <>
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                                            </>
                                                        )}
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                                            {isLoading ? 'Загрузка...' : 'Войти'}
                                        </button>

                                        <div className="auth-links">
                                            <p>
                                                Нет аккаунта?{' '}
                                                <button
                                                    type="button"
                                                    className="link-btn"
                                                    onClick={handleToggleMode}
                                                >
                                                    Зарегистрироваться
                                                </button>
                                            </p>
                                        </div>
                                    </form>
                                ) : (
                                    // Форма регистрации
                                    <form className="auth-form" onSubmit={handleRegisterSubmit}>
                                        <div className="form-group">
                                            <label>Логин</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Придумайте логин"
                                                value={registerData.username}
                                                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                className="form-input"
                                                placeholder="Ваша почта"
                                                value={registerData.email}
                                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Ссылка на канал (Youtube / Twitch / TikTok)</label>
                                            <input
                                                type="url"
                                                className="form-input"
                                                placeholder="https://..."
                                                value={registerData.channelUrl}
                                                onChange={(e) => setRegisterData({ ...registerData, channelUrl: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Пароль</label>
                                            <div className="password-input-wrapper">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="form-input"
                                                    placeholder="Придумайте пароль"
                                                    value={registerData.password}
                                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        {showPassword ? (
                                                            <>
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                                            </>
                                                        )}
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>Подтвердите пароль</label>
                                            <div className="password-input-wrapper">
                                                <input
                                                    type={showPasswordConfirm ? 'text' : 'password'}
                                                    className="form-input"
                                                    placeholder="Подтвердите пароль"
                                                    value={registerData.passwordConfirm}
                                                    onChange={(e) => setRegisterData({ ...registerData, passwordConfirm: e.target.value })}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle"
                                                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        {showPasswordConfirm ? (
                                                            <>
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                                            </>
                                                        )}
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {registerData.password && registerData.passwordConfirm && registerData.password !== registerData.passwordConfirm && (
                                            <p className="error-message">Пароли не совпадают</p>
                                        )}

                                        <div className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="agree"
                                                checked={registerData.agreeTerms}
                                                onChange={(e) => setRegisterData({ ...registerData, agreeTerms: e.target.checked })}
                                                required
                                            />
                                            <label htmlFor="agree">
                                                Создавая учетную запись, я согласен с нашими{' '}
                                                <a href="#" onClick={(e) => { e.preventDefault(); onTermsClick?.(); }}>Условиями использования</a>
                                                {' '}и{' '}
                                                <a href="#" onClick={(e) => { e.preventDefault(); onTermsClick?.(); }}>Политикой конфиденциальности</a>
                                            </label>
                                        </div>

                                        <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                                            {isLoading ? 'Загрузка...' : 'Создать аккаунт'}
                                        </button>

                                        <div className="auth-links">
                                            <p>
                                                Есть аккаунт?{' '}
                                                <button
                                                    type="button"
                                                    className="link-btn"
                                                    onClick={handleToggleMode}
                                                >
                                                    Войти
                                                </button>
                                            </p>
                                        </div>
                                    </form>
                                )}
                            </>
                        ) : forgotStep === 'email' ? (
                            // Форма восстановления - ввод почты
                            <form className="auth-form" onSubmit={handleForgotPasswordSubmit}>
                                <h2 className="auth-title">Восстановление пароля</h2>

                                <div className="form-group">
                                    <label>Введите ваш Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Ваша почта"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn-auth-submit">
                                    Продолжить
                                </button>

                                <div className="auth-links">
                                    <p>
                                        <button
                                            type="button"
                                            className="link-btn"
                                            onClick={() => setForgotStep(null)}
                                        >
                                            Вернуться к авторизации
                                        </button>
                                    </p>
                                </div>
                            </form>
                        ) : (
                            // Форма восстановления - ввод нового пароля
                            <form className="auth-form" onSubmit={handleForgotPasswordSubmit}>
                                <h2 className="auth-title">Новый пароль</h2>

                                <div className="form-group">
                                    <label>Новый пароль</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showResetPassword ? 'text' : 'password'}
                                            className="form-input"
                                            placeholder="Придумайте новый пароль"
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowResetPassword(!showResetPassword)}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                {showResetPassword ? (
                                                    <>
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </>
                                                ) : (
                                                    <>
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Подтвердите пароль</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showResetPasswordConfirm ? 'text' : 'password'}
                                            className="form-input"
                                            placeholder="Подтвердите пароль"
                                            value={resetPasswordConfirm}
                                            onChange={(e) => setResetPasswordConfirm(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowResetPasswordConfirm(!showResetPasswordConfirm)}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                {showResetPasswordConfirm ? (
                                                    <>
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </>
                                                ) : (
                                                    <>
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {resetPassword && resetPasswordConfirm && resetPassword !== resetPasswordConfirm && (
                                    <p className="error-message">Пароли не совпадают</p>
                                )}

                                <button
                                    type="submit"
                                    className="btn-auth-submit"
                                    disabled={!resetPassword || !resetPasswordConfirm || resetPassword !== resetPasswordConfirm}
                                >
                                    Изменить пароль
                                </button>

                                <div className="auth-links">
                                    <p>
                                        <button
                                            type="button"
                                            className="link-btn"
                                            onClick={() => setForgotStep(null)}
                                        >
                                            Вернуться к авторизации
                                        </button>
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            <Footer isAuthPage={true} onHomeClick={onBack} onNavigateToSection={onNavigateToSection} />
        </>
    );
};

export default AuthPage;