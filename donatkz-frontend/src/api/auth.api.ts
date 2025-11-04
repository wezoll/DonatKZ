import axiosInstance from './axiosInstance';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/api.types';

export const authApi = {
    /**
     * Регистрация нового пользователя
     */
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await axiosInstance.post<AuthResponse>('/api/auth/register', data);
        return response.data;
    },

    /**
     * Вход в систему
     */
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await axiosInstance.post<AuthResponse>('/api/auth/login', data);
        return response.data;
    },

    /**
     * Обновление access token через refresh token
     */
    refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
        const response = await axiosInstance.post('/api/auth/refresh', { refreshToken });
        return response.data;
    },

    /**
     * Выход из системы
     */
    logout: (): void => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    /**
     * Проверка email (отправка кода верификации)
     */
    verifyEmail: async (token: string): Promise<{ message: string }> => {
        const response = await axiosInstance.get(`/api/auth/verify-email?token=${token}`);
        return response.data;
    },
};