package kz.donatkz.backend.dto;

import lombok.Data;

/**
 * DTO для обновления виджета статистики
 */
@Data
public class StatisticsWidgetUpdateRequest {
    
    private String title;
    
    // Settings
    private String headerText;
    private String displayType;
    private String dataType;
    private String period;
    private Integer elementsCount;
    private Integer widgetSpeed;
    private String template;
    private String secondTemplate;
    
    // Design
    private String position;
    private String mainTextStyle;
    private String secondaryTextStyle;
    private String headerBackground;
    private String itemBackground;
}


