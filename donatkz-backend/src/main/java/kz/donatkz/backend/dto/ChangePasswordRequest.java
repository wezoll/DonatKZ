package kz.donatkz.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Текущий пароль не может быть пустым")
    private String currentPassword;

    @NotBlank(message = "Новый пароль не может быть пустым")
    @Size(min = 6, message = "Пароль должен содержать минимум 6 символов")
    private String newPassword;

    @NotBlank(message = "Подтверждение пароля не может быть пустым")
    private String confirmPassword;
}


