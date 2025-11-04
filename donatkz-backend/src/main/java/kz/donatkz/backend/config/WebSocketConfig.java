package kz.donatkz.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration для Real-Time уведомлений о донатах
 *
 * Клиенты подключаются к: ws://localhost:8080/ws
 * Подписываются на: /topic/donations/{userId}
 * Получают уведомления в реальном времени когда приходит новый донат
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Настройка STOMP endpoints
     * Клиенты подключаются к /ws
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // В продакшене указать конкретный домен!
                .withSockJS(); // Поддержка SockJS для браузеров без WebSocket
    }

    /**
     * Настройка Message Broker
     * /topic - для broadcast сообщений (pub/sub)
     * /app - префикс для сообщений от клиента к серверу
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue"); // Simple in-memory broker
        registry.setApplicationDestinationPrefixes("/app"); // Префикс для входящих сообщений
    }
}