package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateCodeResponse {

    private String code;              // 6-значный код (например: "A7K9M2")
    private LocalDateTime expiresAt;  // Когда истекает (через 5 минут)
    private Integer expiresInSeconds; // Сколько секунд осталось
}