package kz.donatkz.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Username обязателен")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "Email обязателен")
    @Email(message = "Некорректный email")
    private String email;

    @NotBlank(message = "Ссылка на канал обязательна")
    private String channelUrl; // Новое поле!

    @NotBlank(message = "Пароль обязателен")
    @Size(min = 6, message = "Минимум 6 символов")
    private String password;

    @NotBlank(message = "Подтверждение пароля обязательно")
    private String confirmPassword; // Новое поле!
}