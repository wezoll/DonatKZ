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
public class DeviceInfoDto {

    private Long id;
    private String deviceId;
    private String deviceName;
    private Boolean isActive;
    private LocalDateTime pairedAt;
    private LocalDateTime lastUsedAt;
    private LocalDateTime createdAt;
}