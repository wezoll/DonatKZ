import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Получаем токен из localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  console.log('Token:', token ? 'EXISTS' : 'MISSING');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ========== ТИПЫ ==========

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  transform: 'none' | 'uppercase' | 'lowercase';
  alignment: 'left' | 'center' | 'right';
}

export interface Notification {
  id: number;
  name: string;
  minAmount: number;
  isEnabled: boolean;
  widgetUrl: string;
  gifUrl: string;
  gifType: 'preset' | 'custom';
  soundUrl: string;
  soundType: 'preset' | 'custom';
  displayDuration: number;
  volume: number;
  enterAnimation: 'left' | 'right' | 'top' | 'bottom';
  exitAnimation: 'left' | 'right' | 'top' | 'bottom';
  titleTemplate: string;
  messageTemplate: string;
  titleText: TextStyle;
  messageText: TextStyle;
}

export interface CreateNotificationRequest {
  name: string;
  minAmount: number;
  isEnabled?: boolean;
  gifUrl?: string;
  gifType?: 'preset' | 'custom';
  soundUrl?: string;
  soundType?: 'preset' | 'custom';
  displayDuration?: number;
  volume?: number;
  enterAnimation?: 'left' | 'right' | 'top' | 'bottom';
  exitAnimation?: 'left' | 'right' | 'top' | 'bottom';
  titleTemplate?: string;
  messageTemplate?: string;
  titleText?: TextStyle;
  messageText?: TextStyle;
}

export interface UpdateNotificationRequest {
  name: string;
  minAmount: number;
  isEnabled?: boolean;
  gifUrl?: string;
  gifType?: 'preset' | 'custom';
  soundUrl?: string;
  soundType?: 'preset' | 'custom';
  displayDuration?: number;
  volume?: number;
  enterAnimation?: 'left' | 'right' | 'top' | 'bottom';
  exitAnimation?: 'left' | 'right' | 'top' | 'bottom';
  titleTemplate?: string;
  messageTemplate?: string;
  titleText?: TextStyle;
  messageText?: TextStyle;
}

// ========== API МЕТОДЫ ==========

export const notificationsApi = {
  /**
   * Получить все уведомления пользователя
   */
  getAll: async (): Promise<Notification[]> => {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  /**
   * Получить одно уведомление по ID
   */
  getById: async (id: number): Promise<Notification> => {
    const response = await axios.get(`${API_BASE_URL}/notifications/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  /**
   * Создать новое уведомление
   */
  create: async (data: CreateNotificationRequest): Promise<Notification> => {
    const response = await axios.post(
      `${API_BASE_URL}/notifications`,
      data,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Обновить уведомление
   */
  update: async (
    id: number,
    data: UpdateNotificationRequest
  ): Promise<Notification> => {
    const response = await axios.put(
      `${API_BASE_URL}/notifications/${id}`,
      data,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Удалить уведомление
   */
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/notifications/${id}`, {
      headers: getAuthHeader(),
    });
  },

  /**
   * Включить/выключить уведомление
   */
  toggle: async (id: number): Promise<Notification> => {
    const response = await axios.patch(
      `${API_BASE_URL}/notifications/${id}/toggle`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },
};

export default notificationsApi;