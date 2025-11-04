package kz.donatkz.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO для создания цели
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalCreateRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Target amount is required")
    @Positive(message = "Target amount must be positive")
    private BigDecimal targetAmount;
}


