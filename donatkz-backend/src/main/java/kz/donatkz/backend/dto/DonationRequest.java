package kz.donatkz.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonationRequest {

    @NotNull(message = "Сумма доната обязательна")
    @DecimalMin(value = "100.0", message = "Минимальная сумма доната: 100 тенге")
    @DecimalMax(value = "1000000.0", message = "Максимальная сумма доната: 1,000,000 тенге")
    private BigDecimal amount;

    @NotBlank(message = "Имя отправителя обязательно")
    @Size(min = 2, max = 100, message = "Имя отправителя должно быть от 2 до 100 символов")
    private String senderName;

    @Size(max = 500, message = "Сообщение не должно превышать 500 символов")
    private String message;

    @NotNull(message = "Время доната обязательно")
    private LocalDateTime timestamp; // Время из Kaspi уведомления

    @NotBlank(message = "Оригинальный текст уведомления обязателен")
    private String rawNotificationText; // Полный текст уведомления из Phone Link

    // voiceEnabled НЕ отправляется Desktop App!
    // Backend сам решает озвучивать или нет на основе настроек пользователя
}