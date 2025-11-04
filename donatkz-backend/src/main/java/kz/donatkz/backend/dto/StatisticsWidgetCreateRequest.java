package kz.donatkz.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO для создания виджета статистики
 */
@Data
public class StatisticsWidgetCreateRequest {
    
    @NotBlank(message = "Название виджета не может быть пустым")
    @Size(max = 255, message = "Название виджета не может превышать 255 символов")
    private String title;
    
    // Settings
    private String headerText;
    
    @NotBlank(message = "Тип отображения обязателен")
    private String displayType; // list, slider, ticker
    
    @NotBlank(message = "Тип данных обязателен")
    private String dataType; // recent, largest, most
    
    @NotBlank(message = "Период обязателен")
    private String period;
    
    @NotNull(message = "Количество элементов обязательно")
    private Integer elementsCount;
    
    private Integer widgetSpeed;
    
    @NotBlank(message = "Шаблон строки обязателен")
    private String template;
    
    private String secondTemplate;
    
    // Design
    @NotBlank(message = "Позиция обязательна")
    private String position;
    
    private String mainTextStyle; // JSON string
    private String secondaryTextStyle; // JSON string
    private String headerBackground; // JSON string
    private String itemBackground; // JSON string
}


