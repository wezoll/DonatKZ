package kz.donatkz.backend.service;

import kz.donatkz.backend.exception.BadRequestException;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionValidationService {

    private final UserRepository userRepository;

    /**
     * Проверка активности подписки и лимитов пользователя
     */
    public void validateSubscription(User user) {
        // 1. Проверка истечения подписки
        if (user.getSubscriptionExpiresAt() != null &&
                user.getSubscriptionExpiresAt().isBefore(LocalDateTime.now())) {

            log.warn("Subscription expired for user: {}", user.getEmail());

            // Автоматически переводим на FREE
            user.setSubscriptionTier("FREE");
            user.setIsSubscriptionActive(false);
            user.setMonthlyDonationLimit(100);
            userRepository.save(user);

            throw new BadRequestException("Ваша подписка истекла. Обновите подписку на сайте DonatKZ.");
        }

        // 2. Проверка активности подписки
        if (!user.getIsSubscriptionActive()) {
            log.warn("Subscription inactive for user: {}", user.getEmail());
            throw new BadRequestException("Ваш аккаунт временно заблокирован. Обратитесь в поддержку.");
        }

        // 3. Проверка лимита донатов для FREE тарифа
        if ("FREE".equals(user.getSubscriptionTier())) {
            Integer limit = user.getMonthlyDonationLimit();
            Integer current = user.getCurrentMonthDonations();

            if (current != null && limit != null && current >= limit) {
                log.warn("Donation limit exceeded for FREE user: {}", user.getEmail());
                throw new BadRequestException(
                        String.format("Достигнут лимит донатов (%d/%d) для бесплатного тарифа. " +
                                "Перейдите на PRO для безлимитных донатов.", current, limit)
                );
            }
        }
    }

    /**
     * Проверка лимита устройств (для разных тарифов)
     */
    public void validateDeviceLimit(User user, int currentDeviceCount) {
        int maxDevices = getMaxDevicesForTier(user.getSubscriptionTier());

        if (currentDeviceCount >= maxDevices) {
            throw new BadRequestException(
                    String.format("Достигнут лимит устройств (%d) для тарифа %s. " +
                            "Отключите одно из устройств или обновите тариф.", maxDevices, user.getSubscriptionTier())
            );
        }
    }

    /**
     * Получить максимальное количество устройств для тарифа
     */
    private int getMaxDevicesForTier(String tier) {
        return switch (tier) {
            case "FREE" -> 1;        // FREE - 1 устройство
            case "BASIC" -> 2;       // BASIC - 2 устройства
            case "PREMIUM" -> 5;     // PREMIUM - 5 устройств
            default -> 1;
        };
    }

    /**
     * Проверка возможности использовать озвучку донатов
     */
    public boolean canUseVoice(User user) {
        // Озвучка доступна только для BASIC и PREMIUM
        return "BASIC".equals(user.getSubscriptionTier()) ||
                "PREMIUM".equals(user.getSubscriptionTier());
    }

    /**
     * Увеличить счетчик донатов для FREE тарифа
     */
    public void incrementDonationCount(User user) {
        if ("FREE".equals(user.getSubscriptionTier())) {
            Integer current = user.getCurrentMonthDonations();
            user.setCurrentMonthDonations(current == null ? 1 : current + 1);
            userRepository.save(user);

            log.debug("Incremented donation count for FREE user: {} -> {}",
                    user.getEmail(), user.getCurrentMonthDonations());
        }
    }
}