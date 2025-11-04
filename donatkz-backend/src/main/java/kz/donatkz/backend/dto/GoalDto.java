package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO для цели сбора донатов
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoalDto {

    /**
     * Название цели (например: "ПОЕЗДКА ЗА ГРАНИЦУ")
     */
    private String title;

    /**
     * Целевая сумма для сбора
     */
    private BigDecimal targetAmount;

    /**
     * Собранная сумма на данный момент
     */
    private BigDecimal collectedAmount;

    /**
     * Процент выполнения (0-100)
     */
    private Integer percentage;

    /**
     * Осталось собрать
     */
    private BigDecimal remaining;
}