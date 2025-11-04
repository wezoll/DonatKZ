package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationStatsDto {

    private Long totalCount;          // Общее количество донатов
    private BigDecimal totalAmount;   // Общая сумма
    private BigDecimal averageAmount; // Средний чек
    private BigDecimal maxAmount;     // Максимальный донат

    // Статистика за период (опционально)
    private Long countToday;
    private BigDecimal amountToday;

    private Long countThisWeek;
    private BigDecimal amountThisWeek;

    private Long countThisMonth;
    private BigDecimal amountThisMonth;
}