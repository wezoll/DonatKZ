package kz.donatkz.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class TariffRequestUpdateRequest {
    @NotBlank(message = "Статус не может быть пустым")
    @Pattern(regexp = "^(pending|approved|rejected)$", message = "Неверный статус. Допустимые значения: pending, approved, rejected")
    private String status;

    private String adminNotes;
}

