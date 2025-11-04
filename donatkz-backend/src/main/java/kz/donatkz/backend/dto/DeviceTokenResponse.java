package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceTokenResponse {

    private String deviceToken;           // Долгосрочный JWT токен для Desktop App
    private String deviceName;            // Название устройства
    private LocalDateTime pairedAt;       // Когда было привязано

    // Информация о пользователе
    private String username;
    private String email;
    private String subscriptionTier;      // FREE, PRO, BUSINESS
    private LocalDateTime subscriptionExpiresAt; // Когда истекает подписка
}