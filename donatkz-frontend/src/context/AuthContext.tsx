// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/api.types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Загрузить пользователя из localStorage при монтировании
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const savedUser = localStorage.getItem('user');

                if (token && savedUser) {
                    // Проверить валидность токена через API
                    try {
                        const response = await fetch('http://localhost:8080/api/user/profile', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        if (response.ok) {
                            const userData = await response.json();
                            // Обновить user из API (свежие данные)
                            setUser(userData);
                        } else {
                            // Токен невалиден - очистить
                            console.warn('Token validation failed:', response.status);
                            localStorage.clear();
                            setUser(null);
                        }
                    } catch (apiError) {
                        console.error('Failed to validate token:', apiError);
                        // При ошибке API - очистить авторизацию
                        localStorage.clear();
                        setUser(null);
                    }
                } else {
                    // Нет токена - пользователь не авторизован
                    setUser(null);
                }
            } catch (err) {
                console.error('Failed to load user from localStorage:', err);
                localStorage.clear();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const handleAuthResponse = (response: AuthResponse) => {
        // Сохранить токены
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));

        // Установить пользователя
        setUser(response.user);
        setError(null);
    };

    const login = async (data: LoginRequest) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await authApi.login(data);
            handleAuthResponse(response);
            // Успех - ошибки не было
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Ошибка входа. Проверьте логин и пароль.';
            setError(errorMessage);
            console.error('Login error:', errorMessage);

            // Бросаем ошибку чтобы компонент знал что логин провалился
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterRequest) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await authApi.register(data);
            handleAuthResponse(response);
            // Успех - ошибки не было
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Ошибка регистрации. Попробуйте снова.';
            setError(errorMessage);
            console.error('Registration error:', errorMessage);

            // Бросаем ошибку чтобы компонент знал что регистрация провалилась
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authApi.logout();
        setUser(null);
        setError(null);
    };

    const clearError = () => {
        setError(null);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error,
        clearError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook для использования Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};