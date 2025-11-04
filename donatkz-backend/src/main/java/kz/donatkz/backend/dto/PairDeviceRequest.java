package kz.donatkz.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PairDeviceRequest {

    @NotBlank(message = "Код привязки обязателен")
    @Pattern(regexp = "^[A-Z0-9]{6}$", message = "Код должен состоять из 6 символов (буквы A-Z и цифры 0-9)")
    private String code; // 6-значный код (например: "A7K9M2")

    @NotBlank(message = "Device ID обязателен")
    @Size(min = 10, max = 100, message = "Device ID должен быть от 10 до 100 символов")
    private String deviceId; // Уникальный ID устройства (UUID)

    @Size(max = 100, message = "Название устройства не должно превышать 100 символов")
    private String deviceName; // Название устройства (например: "My Gaming PC", "Work Laptop")
}