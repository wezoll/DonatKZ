package kz.donatkz.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NewsCreateRequest {

    @NotBlank(message = "Тип новости не может быть пустым")
    @Pattern(regexp = "^(update|announcement|feature)$", message = "Допустимые типы: update, announcement, feature")
    private String type;

    @NotBlank(message = "Заголовок не может быть пустым")
    @Size(max = 255, message = "Заголовок не может превышать 255 символов")
    private String title;

    @NotBlank(message = "Описание не может быть пустым")
    private String description;

    @NotBlank(message = "Полное описание не может быть пустым")
    private String fullDescription;

    @Size(max = 100, message = "Бейдж не может превышать 100 символов")
    private String badge;

    @NotBlank(message = "Иконка не может быть пустой")
    @Pattern(regexp = "^(star|megaphone|news)$", message = "Допустимые иконки: star, megaphone, news")
    private String icon;
}

