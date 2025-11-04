package kz.donatkz.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUserRoleRequest {

    @NotBlank(message = "Роль не может быть пустой")
    @Pattern(regexp = "^(USER|ADMIN|SUPERADMIN)$", message = "Допустимые роли: USER, ADMIN, SUPERADMIN")
    private String role;
}

