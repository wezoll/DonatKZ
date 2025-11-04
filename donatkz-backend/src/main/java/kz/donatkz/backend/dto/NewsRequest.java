package kz.donatkz.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsRequest {

    @NotNull(message = "Тип новости обязателен")
    private String type; // update, announcement, feature

    @NotBlank(message = "Заголовок обязателен")
    private String title;

    @NotBlank(message = "Краткое описание обязательно")
    private String description;

    @NotBlank(message = "Полное описание обязательно")
    private String fullDescription;

    private String badge; // Опционально

    @NotNull(message = "Иконка обязательна")
    private String icon; // star, megaphone, news
}

