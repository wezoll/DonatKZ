package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для обновления дизайна цели
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalDesignUpdateRequest {
    
    private Double height;
    private Double borderRadius;
    private Double strokeWidth;
    private String strokeColor;
    private String backgroundColor;
    private Boolean useGradient;
    private String gradientFillColor1;
    private String gradientFillColor2;
    private Integer gradientAngle;
    private Boolean useColor;
    private Boolean showBackground;
    private String titlePosition;
    private String progressPosition;
    private String progressDisplay;
    private String titleTextStyle;
    private String progressTextStyle;
}


