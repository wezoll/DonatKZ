import axiosInstance from './axiosInstance';

export interface WebSocketKeyResponse {
  apiKey: string;
  wsUrl: string;
  topic: string;
  maskedKey: string;
}

export interface WebSocketTestResponse {
  status: string;
  message: string;
  apiKey?: string;
  topic?: string;
  donation?: any;
}

/**
 * API для работы с WebSocket
 */
export const websocketApi = {
  /**
   * Получить WebSocket API Key (или создать новый)
   */
  getApiKey: async (): Promise<WebSocketKeyResponse> => {
    const response = await axiosInstance.get('/api/user/websocket-key');
    return response.data;
  },

  /**
   * Регенерировать WebSocket API Key (отозвать старый)
   */
  regenerateApiKey: async (): Promise<WebSocketKeyResponse> => {
    const response = await axiosInstance.post('/api/user/websocket-key/regenerate');
    return response.data;
  },

  /**
   * Получить информацию о WebSocket подключении
   */
  getInfo: async (): Promise<any> => {
    const response = await axiosInstance.get('/api/websocket/info');
    return response.data;
  },

  /**
   * Отправить тестовый донат через WebSocket
   */
  sendTestDonation: async (): Promise<WebSocketTestResponse> => {
    const response = await axiosInstance.post('/api/websocket/test');
    return response.data;
  },

  /**
   * Получить полный Widget URL
   */
  getWidgetUrl: (apiKey: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/widget/${apiKey}`;
  },
};

export default websocketApi;


