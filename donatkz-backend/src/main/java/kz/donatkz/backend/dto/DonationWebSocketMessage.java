package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * WebSocket уведомление о новом донате
 * Отправляется на Frontend/OBS Widget в реальном времени
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationWebSocketMessage {

    private String type; // "NEW_DONATION", "DONATION_UPDATE", "DONATION_DELETE"

    // Информация о донате
    private Long donationId;
    private BigDecimal amount;
    private String senderName;
    private String message;
    private LocalDateTime timestamp;
    private Boolean voiceEnabled;

    // Дополнительная информация
    private String formattedAmount; // "500 ₸"
    private Long userId; // Для кого этот донат
    private LocalDateTime sentAt; // Когда отправлено уведомление

    // Настройки уведомления (из Notification)
    private NotificationSettingsDto notificationSettings;

    /**
     * Создать сообщение о новом донате
     */
    public static DonationWebSocketMessage newDonation(DonationResponse donation, Long userId) {
        return DonationWebSocketMessage.builder()
                .type("NEW_DONATION")
                .donationId(donation.getId())
                .amount(donation.getAmount())
                .senderName(donation.getSenderName())
                .message(donation.getMessage())
                .timestamp(donation.getTimestamp())
                .voiceEnabled(donation.getVoiceEnabled())
                .formattedAmount(donation.getAmount() + " ₸")
                .userId(userId)
                .sentAt(LocalDateTime.now())
                .build();
    }
}