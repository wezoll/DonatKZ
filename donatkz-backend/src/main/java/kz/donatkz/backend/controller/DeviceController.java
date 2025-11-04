package kz.donatkz.backend.controller;

import jakarta.validation.Valid;
import kz.donatkz.backend.dto.*;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.service.DevicePairingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/device")
@RequiredArgsConstructor
@Slf4j
public class DeviceController {

    private final DevicePairingService devicePairingService;
    private final UserRepository userRepository;

    /**
     * POST /api/device/generate-code
     * Генерация кода для привязки Desktop App (вызывается с Frontend)
     */
    @PostMapping("/generate-code")
    public ResponseEntity<GenerateCodeResponse> generateCode(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("Generating pairing code for user: {}", userDetails.getUsername());

        Long userId = getUserId(userDetails);
        GenerateCodeResponse response = devicePairingService.generatePairingCode(userId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /**
     * GET /api/device/check-status?code=A7K9M2
     * Проверка статуса кода (для Frontend - polling)
     */
    @GetMapping("/check-status")
    public ResponseEntity<Map<String, Boolean>> checkStatus(
            @RequestParam String code
    ) {
        log.info("Checking status for code: {}", code);

        boolean isPaired = devicePairingService.checkCodeStatus(code);

        return ResponseEntity.ok(Map.of("isPaired", isPaired));
    }

    /**
     * POST /api/device/pair
     * Привязка устройства по коду (вызывается из Desktop App)
     */
    @PostMapping("/pair")
    public ResponseEntity<DeviceTokenResponse> pairDevice(
            @Valid @RequestBody PairDeviceRequest request
    ) {
        log.info("Pairing device with code: {}", request.getCode());

        DeviceTokenResponse response = devicePairingService.pairDevice(request);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/device/validate
     * Валидация device token (Desktop App проверяет свой токен)
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateDeviceToken(
            @RequestHeader("Authorization") String authHeader
    ) {
        log.info("Validating device token");

        // Извлечь токен из "Bearer <token>"
        String deviceToken = authHeader.replace("Bearer ", "");

        User user = devicePairingService.validateDeviceToken(deviceToken);

        // Используем HashMap вместо Map.of() для поддержки null значений
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("valid", true);
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("subscriptionTier", user.getSubscriptionTier());
        response.put("subscriptionExpiresAt", user.getSubscriptionExpiresAt() != null ?
                user.getSubscriptionExpiresAt().toString() : null);
        response.put("currentMonthDonations", user.getCurrentMonthDonations() != null ?
                user.getCurrentMonthDonations() : 0);
        response.put("monthlyDonationLimit", user.getMonthlyDonationLimit() != null ?
                user.getMonthlyDonationLimit() : 100);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/device/list
     * Получить список подключенных устройств пользователя
     */
    @GetMapping("/list")
    public ResponseEntity<List<DeviceInfoDto>> getDevices(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("Getting devices for user: {}", userDetails.getUsername());

        Long userId = getUserId(userDetails);
        List<DeviceInfoDto> devices = devicePairingService.getUserDevices(userId);

        return ResponseEntity.ok(devices);
    }

    /**
     * DELETE /api/device/{deviceId}
     * Отключить устройство
     */
    @DeleteMapping("/{deviceId}")
    public ResponseEntity<Map<String, String>> disconnectDevice(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long deviceId
    ) {
        log.info("Disconnecting device {} for user: {}", deviceId, userDetails.getUsername());

        Long userId = getUserId(userDetails);
        devicePairingService.disconnectDevice(userId, deviceId);

        return ResponseEntity.ok(Map.of("message", "Устройство успешно отключено"));
    }

    /**
     * Вспомогательный метод для получения userId из UserDetails
     */
    private Long getUserId(UserDetails userDetails) {
        String username = userDetails.getUsername();

        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        return user.getId();
    }
}