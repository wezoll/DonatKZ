package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO для ответа с данными цели
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalResponse {
    
    private Long id;
    private String title;
    private String description;
    private BigDecimal targetAmount;
    private BigDecimal collectedAmount;
    private Integer percentage;
    private BigDecimal remaining;
    private Boolean isActive;
    private String widgetUrl;
    
    // Дизайн настройки
    private GoalDesignDto design;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


