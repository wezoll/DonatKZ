import axiosInstance from './axiosInstance';

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    displayName: string;
    channelUrl: string;
    kaspiPhone: string;
    subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM';
}

export interface VoiceSettings {
    voiceEnabled: boolean;
    voiceMinAmount: number;
    voiceLanguage: 'ru-RU' | 'kk-KZ' | 'en-US';
    voiceAvailable: boolean;
    subscriptionTier: string;
}

export interface UpdateVoiceSettingsRequest {
    voiceEnabled: boolean;
    voiceMinAmount: number;
    voiceLanguage: 'ru-RU' | 'kk-KZ' | 'en-US';
}

export interface WebSocketKey {
    apiKey: string;
    wsUrl: string;
    topic: string;
    maskedKey: string;
}

export const userApi = {
    /**
     * Получить профиль текущего пользователя
     */
    getProfile: async (): Promise<UserProfile> => {
        const response = await axiosInstance.get('/api/user/profile');
        return response.data;
    },

    /**
     * Обновить номер телефона Kaspi
     */
    updateKaspiPhone: async (kaspiPhone: string): Promise<{ message: string }> => {
        const response = await axiosInstance.put('/api/user/kaspi-phone', {
            kaspiPhone
        });
        return response.data;
    },

    /**
     * Получить настройки озвучки
     */
    getVoiceSettings: async (): Promise<VoiceSettings> => {
        const response = await axiosInstance.get('/api/user/voice-settings');
        return response.data;
    },

    /**
     * Обновить настройки озвучки
     */
    updateVoiceSettings: async (data: UpdateVoiceSettingsRequest): Promise<VoiceSettings> => {
        const response = await axiosInstance.put('/api/user/voice-settings', data);
        return response.data;
    },

    /**
     * Получить WebSocket API Key
     */
    getWebSocketKey: async (): Promise<WebSocketKey> => {
        const response = await axiosInstance.get('/api/user/websocket-key');
        return response.data;
    },

    /**
     * Регенерировать WebSocket API Key
     */
    regenerateWebSocketKey: async (): Promise<WebSocketKey & { message: string }> => {
        const response = await axiosInstance.post('/api/user/websocket-key/regenerate');
        return response.data;
    },
};