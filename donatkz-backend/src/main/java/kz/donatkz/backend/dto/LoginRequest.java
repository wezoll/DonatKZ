package kz.donatkz.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Логин обязателен")
    private String login;

    @NotBlank(message = "Пароль обязателен")
    private String password;
}