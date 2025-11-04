package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopDonorDto {

    private String senderName;       // Имя донатера
    private BigDecimal totalAmount;  // Общая сумма донатов
    private Long donationCount;      // Количество донатов
    private Integer rank;            // Место в топе (1, 2, 3...)
}