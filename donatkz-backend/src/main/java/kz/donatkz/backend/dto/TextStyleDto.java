package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Стиль текста для уведомления
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TextStyleDto {
    private String fontFamily;
    private Integer fontSize;
    private String textColor;
    private Boolean isBold;
    private Boolean isItalic;
    private Boolean isUnderline;
    private String transform; // "none", "uppercase", "lowercase"
    private String alignment; // "left", "center", "right"
}


