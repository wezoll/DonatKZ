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
public class VoiceSettingsResponse {

    private Boolean voiceEnabled;
    private BigDecimal voiceMinAmount;
    private String voiceLanguage;
    private String voiceType; // robot, female, male
    private Integer voiceVolume; // 0-100

    // Дополнительная информация
    private Boolean voiceAvailable; // Доступна ли озвучка для текущего тарифа (PRO/BUSINESS)
    private String subscriptionTier;
}