package kz.donatkz.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    private Long id;
    private String username;
    private String email;
    private String role; // USER, ADMIN, SUPERADMIN
    private String tariff; // FREE, BASIC, PREMIUM
    private String tariffStart;
    private String tariffEnd;
    private LocalDateTime createdAt;
}

