package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.NotificationDto;
import kz.donatkz.backend.dto.NotificationSettingsDto;
import kz.donatkz.backend.dto.TextStyleDto;
import kz.donatkz.backend.model.Notification;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Сервис для выбора подходящего уведомления по сумме доната
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationMatcherService {

    private final NotificationRepository notificationRepository;

    /**
     * Найти подходящее уведомление для доната
     * Выбирается уведомление с максимальной суммой, не превышающей сумму доната
     * 
     * Например:
     * - Уведомления: 100₸, 500₸, 1000₸
     * - Донат: 750₸ → выбирается уведомление "500₸"
     * - Донат: 50₸ → нет подходящего
     */
    public Optional<NotificationSettingsDto> findMatchingNotification(User user, BigDecimal donationAmount) {
        try {
            log.info("🔍 Finding matching notification for user: {}, amount: {}", 
                    user.getUsername(), donationAmount);
            
            // Получить все включенные уведомления пользователя
            List<Notification> notifications = notificationRepository
                    .findByUserAndIsEnabledOrderByMinAmountDesc(user, true);

            log.info("📋 Found {} enabled notifications for user: {}", 
                    notifications.size(), user.getUsername());
            
            if (!notifications.isEmpty()) {
                notifications.forEach(n -> 
                    log.info("  - Notification: name='{}', minAmount={}, enabled={}", 
                            n.getName(), n.getMinAmount(), n.getIsEnabled())
                );
            }

            if (notifications.isEmpty()) {
                log.warn("❌ No notifications found for user: {}", user.getUsername());
                return Optional.empty();
            }

            // Найти подходящее уведомление
            // Сортировка по убыванию minAmount, поэтому ищем первое где minAmount <= donationAmount
            Optional<Notification> matchingNotification = notifications.stream()
                    .filter(n -> n.getMinAmount().compareTo(donationAmount) <= 0)
                    .findFirst();

            if (matchingNotification.isEmpty()) {
                log.warn("❌ No matching notification for amount: {} (user: {})", 
                        donationAmount, user.getUsername());
                return Optional.empty();
            }

            Notification notification = matchingNotification.get();
            log.info("✅ Found matching notification: '{}' (minAmount={}) for donation amount: {} (user: {})", 
                    notification.getName(), notification.getMinAmount(), donationAmount, user.getUsername());

            // Конвертировать в DTO
            return Optional.of(convertToSettingsDto(notification));

        } catch (Exception e) {
            log.error("Error finding matching notification for user: {}, amount: {}", 
                    user.getUsername(), donationAmount, e);
            return Optional.empty();
        }
    }

    /**
     * Конвертировать Notification в NotificationSettingsDto
     */
    private NotificationSettingsDto convertToSettingsDto(Notification notification) {
        return NotificationSettingsDto.builder()
                .gifUrl(notification.getGifUrl())
                .gifType(notification.getGifType())
                .soundUrl(notification.getSoundUrl())
                .soundType(notification.getSoundType())
                .displayDuration(notification.getDisplayDuration())
                .volume(notification.getVolume())
                .enterAnimation(notification.getEnterAnimation())
                .exitAnimation(notification.getExitAnimation())
                .titleTemplate(notification.getTitleTemplate())
                .messageTemplate(notification.getMessageTemplate())
                .titleText(convertTextStyle(notification.getTitleFontFamily(), notification.getTitleFontSize(),
                        notification.getTitleTextColor(), notification.getTitleIsBold(), 
                        notification.getTitleIsItalic(), notification.getTitleIsUnderline(),
                        notification.getTitleTransform(), notification.getTitleAlignment()))
                .messageText(convertTextStyle(notification.getMessageFontFamily(), notification.getMessageFontSize(),
                        notification.getMessageTextColor(), notification.getMessageIsBold(),
                        notification.getMessageIsItalic(), notification.getMessageIsUnderline(),
                        notification.getMessageTransform(), notification.getMessageAlignment()))
                .build();
    }

    /**
     * Создать TextStyleDto из отдельных полей
     */
    private TextStyleDto convertTextStyle(String fontFamily, Integer fontSize, String textColor,
                                          Boolean isBold, Boolean isItalic, Boolean isUnderline,
                                          String transform, String alignment) {
        return TextStyleDto.builder()
                .fontFamily(fontFamily)
                .fontSize(fontSize)
                .textColor(textColor)
                .isBold(isBold != null ? isBold : false)
                .isItalic(isItalic != null ? isItalic : false)
                .isUnderline(isUnderline != null ? isUnderline : false)
                .transform(transform != null ? transform : "none")
                .alignment(alignment != null ? alignment : "center")
                .build();
    }
}

