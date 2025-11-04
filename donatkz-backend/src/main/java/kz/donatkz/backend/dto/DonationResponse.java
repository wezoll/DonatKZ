package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationResponse {

    private Long id;
    private BigDecimal amount;
    private String senderName;
    private String message;
    private LocalDateTime timestamp; // Время из Kaspi
    private String status; // PENDING, PROCESSED, FAILED, DUPLICATE
    private Boolean voiceEnabled;
    private LocalDateTime createdAt; // Когда добавлено в систему
}