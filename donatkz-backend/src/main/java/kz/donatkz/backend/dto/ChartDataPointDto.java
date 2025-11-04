package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для точки на графике донатов
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataPointDto {
    private String time;       // Временная метка (например: "12:00", "Пн", "Янв")
    private Double value;      // Сумма донатов в этот период
}