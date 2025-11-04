package kz.donatkz.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoiceSettingsRequest {

    @NotNull(message = "Необходимо указать, включена ли озвучка")
    private Boolean voiceEnabled;

    @NotNull(message = "Минимальная сумма обязательна")
    @DecimalMin(value = "100", message = "Минимальная сумма для озвучки не может быть меньше 100₸")
    private BigDecimal voiceMinAmount;

    @NotNull(message = "Язык озвучки обязателен")
    @Pattern(regexp = "^(ru-RU|kk-KZ|en-US)$", message = "Доступные языки: ru-RU, kk-KZ, en-US")
    private String voiceLanguage;

    @NotNull(message = "Тип голоса обязателен")
    @Pattern(regexp = "^(robot|female|male)$", message = "Доступные типы голоса: robot, female, male")
    private String voiceType;

    @NotNull(message = "Громкость обязательна")
    private Integer voiceVolume; // 0-100
}