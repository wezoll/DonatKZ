package kz.donatkz.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FaqCreateRequest {

    @NotBlank(message = "Вопрос не может быть пустым")
    private String question;

    @NotBlank(message = "Ответ не может быть пустым")
    private String answer;

    private Integer displayOrder;
}

