package kz.donatkz.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO для обновления цели сбора
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGoalRequest {

    @NotBlank(message = "Название цели обязательно")
    private String title;

    @NotNull(message = "Целевая сумма обязательна")
    @DecimalMin(value = "0.01", message = "Целевая сумма должна быть больше 0")
    private BigDecimal targetAmount;
}