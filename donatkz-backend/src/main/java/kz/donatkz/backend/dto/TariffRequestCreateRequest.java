package kz.donatkz.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TariffRequestCreateRequest {
    @NotBlank(message = "Тариф не может быть пустым")
    private String tariff; // FREE, BASIC, PREMIUM

    @NotNull(message = "Длительность подписки обязательна")
    @Positive(message = "Длительность подписки должна быть положительным числом")
    private Integer durationMonths;

    @NotNull(message = "Сумма обязательна")
    @Positive(message = "Сумма должна быть положительным числом")
    private BigDecimal amount;

    private String promocode;

    private String receiptUrl; // URL загруженного чека
}

