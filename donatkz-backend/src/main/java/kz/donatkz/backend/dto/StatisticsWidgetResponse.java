package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO для ответа с данными виджета статистики
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatisticsWidgetResponse {
    
    private Long id;
    private String title;
    private String widgetUrl;
    
    // Settings (плоская структура)
    private String headerText;
    private String displayType; // list, slider, ticker
    private String dataType; // recent, largest, most
    private String period; // current-stream, last-stream, all-time, today, week, month, year
    private Integer elementsCount;
    private Integer widgetSpeed;
    private String template;
    private String secondTemplate;
    
    // Design (плоская структура)
    private String position; // top, center, bottom
    private String mainTextStyle; // JSON string
    private String secondaryTextStyle; // JSON string
    private String headerBackground; // JSON string
    private String itemBackground; // JSON string
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

