import SockJS from 'sockjs-client';
import { Client, StompSubscription } from '@stomp/stompjs';

/**
 * WebSocket Service для real-time уведомлений о донатах
 * Использует STOMP + SockJS
 */

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  transform: string;
  alignment: string;
}

export interface NotificationSettings {
  gifUrl: string;
  gifType: string;
  soundUrl: string;
  soundType: string;
  displayDuration: number;
  volume: number;
  enterAnimation: string;
  exitAnimation: string;
  titleTemplate: string;
  messageTemplate: string;
  titleText: TextStyle;
  messageText: TextStyle;
}

export interface DonationWebSocketMessage {
  type: string; // "NEW_DONATION"
  donationId: number;
  amount: number;
  senderName: string;
  message: string;
  timestamp: string;
  voiceEnabled: boolean;
  formattedAmount: string;
  sentAt: string;
  notificationSettings?: NotificationSettings; // Настройки уведомления
}

export type DonationCallback = (donation: DonationWebSocketMessage) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;

  /**
   * Подключиться к WebSocket и подписаться на донаты
   */
  connect(apiKey: string, onDonation: DonationCallback, onError?: (error: any) => void): void {
    // URL WebSocket endpoint (SockJS использует HTTP, не WS!)
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
    
    if (import.meta.env.DEV) {
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      console.log('🔑 API Key:', apiKey.substring(0, 8) + '...');
    }

    // Создаем SockJS клиент (использует HTTP URL, сам переключится на WebSocket)
    const socket = new SockJS(wsUrl);

    // Создаем STOMP клиент
    this.client = new Client({
      webSocketFactory: () => socket as any,
      
      connectHeaders: {},
      
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.log('📡 STOMP:', str);
        }
      },

      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        if (import.meta.env.DEV) {
          console.log('✅ WebSocket connected!');
        }
        this.reconnectAttempts = 0;
        
        // Подписываемся на topic с донатами
        const topic = `/topic/donations/${apiKey}`;
        if (import.meta.env.DEV) {
          console.log('📢 Subscribing to:', topic);
        }

        this.subscription = this.client!.subscribe(topic, (message) => {
          try {
            const donation: DonationWebSocketMessage = JSON.parse(message.body);
            if (import.meta.env.DEV) {
              console.log('💰 New donation received:', donation);
            }
            onDonation(donation);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('❌ Failed to parse donation message:', error);
            }
          }
        });

        if (import.meta.env.DEV) {
          console.log('🎉 Successfully subscribed to donations!');
        }
      },

      onStompError: (frame) => {
        if (import.meta.env.DEV) {
          console.error('❌ STOMP error:', frame.headers['message']);
          console.error('Details:', frame.body);
        }
        if (onError) {
          onError(new Error(frame.headers['message']));
        }
      },

      onWebSocketError: (event) => {
        if (import.meta.env.DEV) {
          console.error('❌ WebSocket error:', event);
        }
        if (onError) {
          onError(event);
        }
      },

      onDisconnect: () => {
        if (import.meta.env.DEV) {
          console.log('🔌 WebSocket disconnected');
        }
        this.attemptReconnect(apiKey, onDonation, onError);
      },
    });

    // Активируем клиент
    this.client.activate();
  }

  /**
   * Попытка переподключения
   */
  private attemptReconnect(apiKey: string, onDonation: DonationCallback, onError?: (error: any) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      if (import.meta.env.DEV) {
        console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      }
      
      setTimeout(() => {
        this.connect(apiKey, onDonation, onError);
      }, this.reconnectDelay);
    } else {
      if (import.meta.env.DEV) {
        console.error('❌ Max reconnect attempts reached. Giving up.');
      }
      if (onError) {
        onError(new Error('Failed to reconnect after ' + this.maxReconnectAttempts + ' attempts'));
      }
    }
  }

  /**
   * Отключиться от WebSocket
   */
  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.reconnectAttempts = 0;
    if (import.meta.env.DEV) {
      console.log('🔌 WebSocket service disconnected');
    }
  }

  /**
   * Проверка подключения
   */
  isConnected(): boolean {
    return this.client?.active || false;
  }
}

// Singleton экземпляр
export const websocketService = new WebSocketService();

