package kz.donatkz.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class TariffRequestResponse {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private String tariff;
    private Integer durationMonths;
    private BigDecimal amount;
    private String promocode;
    private String receiptUrl;
    private String status; // pending, approved, rejected
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
    private String reviewedByUsername;
}

