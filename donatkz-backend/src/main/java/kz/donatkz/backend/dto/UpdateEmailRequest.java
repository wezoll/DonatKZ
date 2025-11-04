package kz.donatkz.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateEmailRequest {

    @NotBlank(message = "Email не может быть пустым")
    @Email(message = "Неверный формат email")
    private String email;
}


