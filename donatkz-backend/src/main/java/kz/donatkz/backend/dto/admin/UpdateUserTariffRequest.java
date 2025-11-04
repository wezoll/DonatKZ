package kz.donatkz.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUserTariffRequest {

    @NotBlank(message = "Тариф не может быть пустым")
    @Pattern(regexp = "^(FREE|BASIC|PREMIUM)$", message = "Допустимые тарифы: FREE, BASIC, PREMIUM")
    private String tariff;

    @NotNull(message = "Дата начала не может быть пустой")
    private String tariffStart; // yyyy-MM-dd

    @NotNull(message = "Дата окончания не может быть пустой")
    private String tariffEnd; // yyyy-MM-dd
}

