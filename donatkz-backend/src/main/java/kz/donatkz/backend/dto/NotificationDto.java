package kz.donatkz.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO для создания/обновления уведомления
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

    private Long id;

    @NotBlank(message = "Название не может быть пустым")
    private String name;

    @DecimalMin(value = "0.0", message = "Минимальная сумма не может быть отрицательной")
    private BigDecimal minAmount;

    private Boolean isEnabled;

    private String widgetUrl;

    // Изображение/GIF
    private String gifUrl;
    private String gifType; // preset или custom

    // Звук
    private String soundUrl;
    private String soundType; // preset или custom

    // Настройки отображения
    @Min(value = 3, message = "Минимальное время показа - 3 секунды")
    @Max(value = 30, message = "Максимальное время показа - 30 секунд")
    private Integer displayDuration;

    @Min(value = 0, message = "Минимальная громкость - 0")
    @Max(value = 100, message = "Максимальная громкость - 100")
    private Integer volume;

    private String enterAnimation; // left, right, top, bottom
    private String exitAnimation;

    // Шаблоны текста
    private String titleTemplate;
    private String messageTemplate;

    // Стили заголовка
    private TextStyleDto titleText;

    // Стили сообщения
    private TextStyleDto messageText;

    /**
     * DTO для стилей текста
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TextStyleDto {
        private String fontFamily;

        @Min(value = 12, message = "Минимальный размер шрифта - 12")
        @Max(value = 64, message = "Максимальный размер шрифта - 64")
        private Integer fontSize;

        private String textColor;
        private Boolean isBold;
        private Boolean isItalic;
        private Boolean isUnderline;
        private String transform; // none, uppercase, lowercase
        private String alignment; // left, center, right
    }
}