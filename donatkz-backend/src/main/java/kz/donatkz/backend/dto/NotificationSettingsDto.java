package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Настройки уведомления для WebSocket
 * Отправляется вместе с донатом на виджет
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSettingsDto {
    
    // GIF/Видео
    private String gifUrl;
    private String gifType; // "preset" или "custom"
    
    // Звук
    private String soundUrl;
    private String soundType; // "preset" или "custom"
    
    // Настройки отображения
    private Integer displayDuration; // в секундах
    private Integer volume; // 0-100
    private String enterAnimation; // "left", "right", "top", "bottom"
    private String exitAnimation;
    
    // Шаблоны текста
    private String titleTemplate; // "{username} - {amount}!"
    private String messageTemplate; // "{message}"
    
    // Стили текста
    private TextStyleDto titleText;
    private TextStyleDto messageText;
}


