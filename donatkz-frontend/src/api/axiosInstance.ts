// src/api/axiosInstance.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types/api.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Создаем экземпляр axios
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 секунд
});

// Request interceptor - добавляет JWT токен к каждому запросу
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - обрабатывает ошибки и refresh token
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Если 401 ошибка и это НЕ повторный запрос
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            // Помечаем что это повторный запрос (предотвращаем бесконечный цикл!)
            originalRequest._retry = true;

            // Если это запрос на логин/регистр - НЕ пытаемся refresh
            if (originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/register') ||
                originalRequest.url?.includes('/auth/refresh')) {
                return Promise.reject(error);
            }

            try {
                // Попытка обновить токен
                const refreshToken = localStorage.getItem('refreshToken');

                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/api/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);

                    // Повторяем оригинальный запрос с новым токеном
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    }

                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                // Если refresh не удался - разлогинить
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');

                // Перенаправляем на логин только если не на странице auth
                if (!window.location.pathname.includes('/auth')) {
                    window.location.href = '/auth/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;