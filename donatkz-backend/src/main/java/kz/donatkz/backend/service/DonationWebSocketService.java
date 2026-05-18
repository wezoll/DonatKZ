package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.DonationResponse;
import kz.donatkz.backend.dto.DonationWebSocketMessage;
import kz.donatkz.backend.dto.NotificationSettingsDto;
import kz.donatkz.backend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Сервис для отправки WebSocket уведомлений о донатах
 *
 * Использует STOMP протокол для real-time коммуникации
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DonationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationMatcherService notificationMatcherService;
    private final ModerationService moderationService;

    /**
     * Отправить уведомление о новом донате конкретному пользователю
     *
     * Frontend подписывается на: /topic/donations/{apiKey}
     *
     * @param donation - информация о донате
     * @param user     - пользователь (получатель доната)
     * @param apiKey   - WebSocket API Key пользователя
     */
    public void sendNewDonationNotification(DonationResponse donation, User user, String apiKey) {
        try {
            // Найти подходящее уведомление по сумме доната
            Optional<NotificationSettingsDto> notificationSettings = notificationMatcherService
                    .findMatchingNotification(user, donation.getAmount());

            if (notificationSettings.isEmpty()) {
                log.warn("No matching notification found for donation amount: {} (user: {})",
                        donation.getAmount(), user.getUsername());
                // Можно отправить с дефолтными настройками или не отправлять вообще
                // Пока не отправляем
                return;
            }

            // ПРИМЕНИТЬ МОДЕРАЦИЮ к сообщению и имени отправителя
            String moderatedMessage = moderationService.moderateText(donation.getMessage(), user);
            String moderatedSenderName = moderationService.moderateText(donation.getSenderName(), user);

            // Создать WebSocket сообщение с настройками уведомления
            DonationWebSocketMessage message = DonationWebSocketMessage.builder()
                    .type("NEW_DONATION")
                    .donationId(donation.getId())
                    .amount(donation.getAmount())
                    .senderName(moderatedSenderName) // ✅ Отфильтрованное имя
                    .message(moderatedMessage) // ✅ Отфильтрованное сообщение
                    .timestamp(donation.getTimestamp())
                    .voiceEnabled(donation.getVoiceEnabled())
                    .formattedAmount(donation.getAmount() + " ₸")
                    .sentAt(java.time.LocalDateTime.now())
                    .notificationSettings(notificationSettings.get())
                    .build();

            // Отправить на topic с API Key вместо userId
            String destination = "/topic/donations/" + apiKey;
            messagingTemplate.convertAndSend(destination, message);

            log.info("WebSocket notification sent: apiKey={}, donationId={}, amount={}, notification={}",
                    apiKey.substring(0, 8) + "...", donation.getId(), donation.getAmount(),
                    notificationSettings.get().getGifUrl());

        } catch (Exception e) {
            log.error("Failed to send WebSocket notification: donationId={}",
                    donation.getId(), e);
            // Не бросаем исключение - WebSocket не должен ломать основной flow
        }
    }

    /**
     * Отправить уведомление всем подключенным клиентам (broadcast)
     * Используется для общих уведомлений
     * 
     * ВНИМАНИЕ: Broadcast не применяет модерацию, т.к. нет конкретного пользователя
     */
    public void broadcastDonation(DonationResponse donation) {
        try {
            DonationWebSocketMessage message = DonationWebSocketMessage.builder()
                    .type("NEW_DONATION")
                    .donationId(donation.getId())
                    .amount(donation.getAmount())
                    .senderName(donation.getSenderName())
                    .message(donation.getMessage())
                    .formattedAmount(donation.getAmount() + " ₸")
                    .sentAt(java.time.LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend("/topic/donations/all", message);

            log.info("Broadcast WebSocket notification sent: donationId={}", donation.getId());

        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket notification: donationId={}", donation.getId(), e);
        }
    }
}