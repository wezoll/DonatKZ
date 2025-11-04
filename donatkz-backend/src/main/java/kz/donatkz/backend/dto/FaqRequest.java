package kz.donatkz.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaqRequest {

    @NotBlank(message = "Вопрос обязателен")
    private String question;

    @NotBlank(message = "Ответ обязателен")
    private String answer;

    private Integer displayOrder; // Порядок отображения
}

