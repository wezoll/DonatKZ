package kz.donatkz.backend.dto;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO для обновления цели
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalUpdateRequest {
    
    private String title;
    private String description;
    
    @Positive(message = "Target amount must be positive")
    private BigDecimal targetAmount;
    
    private Boolean isActive;
}


