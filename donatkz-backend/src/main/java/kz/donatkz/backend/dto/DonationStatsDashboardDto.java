package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для статистики донатов (Dashboard)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonationStatsDashboardDto {
    private Long totalCount;        // Общее количество донатов
    private Double totalAmount;     // Общая сумма донатов
    private Double averageAmount;   // Средняя сумма доната
    private Double maxAmount;       // Максимальный донат
}