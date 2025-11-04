package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO для отображения доната
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonationDto {
    private Long id;
    private Double amount;
    private String senderName;
    private String message;
    private LocalDateTime timestamp;
    private String status;          // PENDING, PROCESSED, FAILED
    private Boolean voiceEnabled;
}