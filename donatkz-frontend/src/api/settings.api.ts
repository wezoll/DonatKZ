import axiosInstance from './axiosInstance';

// ========== INTERFACES ==========

export interface VoiceSettings {
  voiceEnabled: boolean;
  voiceMinAmount: number;
  voiceLanguage: string; // ru-RU, kk-KZ, en-US
  voiceType: string; // robot, female, male
  voiceVolume: number; // 0-100
  voiceAvailable: boolean;
  subscriptionTier: string;
}

export interface VoiceSettingsRequest {
  voiceEnabled: boolean;
  voiceMinAmount: number;
  voiceLanguage: string;
  voiceType: string;
  voiceVolume: number;
}

export interface ModerationSettings {
  moderationEnabled: boolean;
  bannedWords: string[];
}

export interface ModerationSettingsRequest {
  moderationEnabled: boolean;
  bannedWords: string[];
}

export interface UpdateEmailRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface WebSocketKeyResponse {
  apiKey: string;
  wsUrl: string;
  topic: string;
  maskedKey: string;
}

export interface DesktopKeyResponse {
  code: string;
  expiresAt: string;
  expiresInSeconds: number;
}

// ========== API SERVICE ==========

export const settingsApi = {
  // ========== PROFILE ==========
  
  /**
   * Обновить email
   */
  updateEmail: async (email: string): Promise<{ message: string }> => {
    const response = await axiosInstance.put('/api/user/email', { email });
    return response.data;
  },

  // ========== VOICE ==========
  
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
  updateVoiceSettings: async (settings: VoiceSettingsRequest): Promise<VoiceSettings> => {
    const response = await axiosInstance.put('/api/user/voice-settings', settings);
    return response.data;
  },

  // ========== MODERATION ==========
  
  /**
   * Получить настройки модерации
   */
  getModerationSettings: async (): Promise<ModerationSettings> => {
    const response = await axiosInstance.get('/api/user/moderation-settings');
    return response.data;
  },

  /**
   * Обновить настройки модерации
   */
  updateModerationSettings: async (settings: ModerationSettingsRequest): Promise<ModerationSettings> => {
    const response = await axiosInstance.put('/api/user/moderation-settings', settings);
    return response.data;
  },

  // ========== SECURITY ==========
  
  /**
   * Изменить пароль
   */
  changePassword: async (request: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await axiosInstance.put('/api/user/password', request);
    return response.data;
  },

  /**
   * Получить Widget API ключ
   */
  getWidgetApiKey: async (): Promise<WebSocketKeyResponse> => {
    const response = await axiosInstance.get('/api/user/websocket-key');
    return response.data;
  },

  /**
   * Регенерировать Widget API ключ
   */
  regenerateWidgetApiKey: async (): Promise<WebSocketKeyResponse> => {
    const response = await axiosInstance.post('/api/user/websocket-key/regenerate', {});
    return response.data;
  },

  /**
   * Сгенерировать Desktop API ключ (6-значный код)
   */
  generateDesktopApiKey: async (): Promise<DesktopKeyResponse> => {
    const response = await axiosInstance.post('/api/device/generate-code', {});
    return response.data;
  },

  /**
   * Проверить статус Desktop кода
   */
  checkDesktopCodeStatus: async (code: string): Promise<{ isPaired: boolean }> => {
    const response = await axiosInstance.get('/api/device/check-status', {
      params: { code }
    });
    return response.data;
  },
};


