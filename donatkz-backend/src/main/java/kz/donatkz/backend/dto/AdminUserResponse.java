package kz.donatkz.backend.dto;

import kz.donatkz.backend.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO для отображения пользователя в админ-панели
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {
    
    private Long id;
    private String username;
    private String email;
    private UserRole role;
    private String tariff; // subscription_tier
    private LocalDateTime tariffStart; // created_at или start subscription
    private LocalDateTime tariffEnd; // subscription_expires_at
    private Boolean isActive;
    private LocalDateTime createdAt;
}

