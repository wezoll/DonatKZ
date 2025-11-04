package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.DeviceInfoDto;
import kz.donatkz.backend.dto.DeviceTokenResponse;
import kz.donatkz.backend.dto.GenerateCodeResponse;
import kz.donatkz.backend.dto.PairDeviceRequest;
import kz.donatkz.backend.exception.BadRequestException;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.DevicePairing;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.DevicePairingRepository;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DevicePairingService {

    private final DevicePairingRepository devicePairingRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final SubscriptionValidationService subscriptionValidationService;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Без O, 0, 1, I для удобства
    private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRY_MINUTES = 5;

    /**
     * Генерация кода для привязки устройства
     */
    @Transactional
    public GenerateCodeResponse generatePairingCode(Long userId) {
        log.info("Generating pairing code for user: {}", userId);

        // Проверить пользователя
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        // Проверить лимит устройств
        Integer activeDeviceCount = devicePairingRepository.countActiveDevicesByUserId(userId);
        subscriptionValidationService.validateDeviceLimit(user, activeDeviceCount);

        // Генерировать уникальный код
        String code;
        do {
            code = generateRandomCode();
        } while (devicePairingRepository.existsByPairingCode(code));

        // Создать запись
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES);

        DevicePairing pairing = new DevicePairing();
        pairing.setUserId(userId);
        pairing.setPairingCode(code);
        pairing.setExpiresAt(expiresAt);
        pairing.setIsActive(false);

        devicePairingRepository.save(pairing);

        log.info("Pairing code generated: code={}, userId={}, expiresAt={}", code, userId, expiresAt);

        // Вычислить сколько секунд осталось
        long secondsUntilExpiry = Duration.between(LocalDateTime.now(), expiresAt).getSeconds();

        return GenerateCodeResponse.builder()
                .code(code)
                .expiresAt(expiresAt)
                .expiresInSeconds((int) secondsUntilExpiry)
                .build();
    }

    /**
     * Привязка устройства по коду
     */
    @Transactional
    public DeviceTokenResponse pairDevice(PairDeviceRequest request) {
        log.info("Pairing device with code: {}, deviceId: {}", request.getCode(), request.getDeviceId());

        // Проверить, не привязано ли это устройство уже к другому аккаунту
        Optional<DevicePairing> existingDevice = devicePairingRepository.findByDeviceId(request.getDeviceId());
        if (existingDevice.isPresent()) {
            DevicePairing existing = existingDevice.get();

            // Если устройство уже активно - запретить привязку к новому аккаунту
            if (existing.getIsActive()) {
                log.warn("Device {} is already paired to another account (userId: {})",
                        request.getDeviceId(), existing.getUserId());
                throw new BadRequestException(
                        "Это устройство уже привязано к другому аккаунту. " +
                                "Отключите его в настройках того аккаунта или обратитесь в поддержку."
                );
            }
        }

        // Найти валидный код
        DevicePairing pairing = devicePairingRepository.findValidPairingCode(
                request.getCode().toUpperCase(),
                LocalDateTime.now()
        ).orElseThrow(() -> new BadRequestException("Неверный или истекший код привязки"));

        // Проверить, не активирован ли уже
        if (pairing.getIsActive()) {
            throw new BadRequestException("Этот код уже был использован");
        }

        // Получить пользователя
        User user = userRepository.findById(pairing.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        // Генерировать долгосрочный Device Token (1 год)
        String deviceToken = jwtTokenProvider.generateDeviceToken(user);

        // Обновить запись
        pairing.setDeviceToken(deviceToken);
        pairing.setDeviceId(request.getDeviceId()); // Сохранить device_id
        pairing.setDeviceName(request.getDeviceName() != null ? request.getDeviceName() : "Desktop App");
        pairing.setIsActive(true);
        pairing.setPairedAt(LocalDateTime.now());
        pairing.setLastUsedAt(LocalDateTime.now());

        devicePairingRepository.save(pairing);

        log.info("Device paired successfully: userId={}, deviceId={}, deviceName={}",
                user.getId(), request.getDeviceId(), pairing.getDeviceName());

        return DeviceTokenResponse.builder()
                .deviceToken(deviceToken)
                .deviceName(pairing.getDeviceName())
                .pairedAt(pairing.getPairedAt())
                .username(user.getUsername())
                .email(user.getEmail())
                .subscriptionTier(user.getSubscriptionTier())
                .subscriptionExpiresAt(user.getSubscriptionExpiresAt())
                .build();
    }

    /**
     * Проверка статуса кода (для фронтенда - polling)
     */
    public boolean checkCodeStatus(String code) {
        return devicePairingRepository.findByPairingCode(code.toUpperCase())
                .map(DevicePairing::getIsActive)
                .orElse(false);
    }

    /**
     * Валидация device token и получение пользователя
     */
    @Transactional
    public User validateDeviceToken(String deviceToken) {
        // Найти устройство по токену
        DevicePairing pairing = devicePairingRepository.findByDeviceToken(deviceToken)
                .orElseThrow(() -> new BadRequestException("Неверный device token"));

        // Проверить активность
        if (!pairing.getIsActive()) {
            throw new BadRequestException("Устройство деактивировано");
        }

        // Обновить lastUsedAt
        pairing.setLastUsedAt(LocalDateTime.now());
        devicePairingRepository.save(pairing);

        // Получить пользователя
        User user = userRepository.findById(pairing.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        // Проверить подписку
        subscriptionValidationService.validateSubscription(user);

        return user;
    }

    /**
     * Получить список устройств пользователя
     */
    public List<DeviceInfoDto> getUserDevices(Long userId) {
        List<DevicePairing> devices = devicePairingRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return devices.stream()
                .filter(DevicePairing::getIsActive) // Только активные
                .map(this::mapToDeviceInfo)
                .collect(Collectors.toList());
    }

    /**
     * Отключить устройство
     */
    @Transactional
    public void disconnectDevice(Long userId, Long deviceId) {
        DevicePairing pairing = devicePairingRepository.findById(deviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Устройство не найдено"));

        // Проверить владельца
        if (!pairing.getUserId().equals(userId)) {
            throw new BadRequestException("У вас нет доступа к этому устройству");
        }

        // Деактивировать
        pairing.setIsActive(false);
        devicePairingRepository.save(pairing);

        log.info("Device disconnected: userId={}, deviceId={}, deviceName={}",
                userId, deviceId, pairing.getDeviceName());
    }

    /**
     * Очистка истекших кодов (cron job)
     */
    @Transactional
    public void cleanupExpiredCodes() {
        LocalDateTime now = LocalDateTime.now();
        List<DevicePairing> expired = devicePairingRepository.findExpiredInactivePairings(now);

        if (!expired.isEmpty()) {
            devicePairingRepository.deleteAll(expired);
            log.info("Cleaned up {} expired pairing codes", expired.size());
        }
    }

    /**
     * Генерация случайного 6-значного кода
     */
    private String generateRandomCode() {
        SecureRandom random = new SecureRandom();
        StringBuilder code = new StringBuilder(CODE_LENGTH);

        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = random.nextInt(CODE_CHARS.length());
            code.append(CODE_CHARS.charAt(index));
        }

        return code.toString();
    }

    /**
     * Маппинг DevicePairing -> DeviceInfoDto
     */
    private DeviceInfoDto mapToDeviceInfo(DevicePairing pairing) {
        return DeviceInfoDto.builder()
                .id(pairing.getId())
                .deviceId(pairing.getDeviceId())
                .deviceName(pairing.getDeviceName())
                .isActive(pairing.getIsActive())
                .pairedAt(pairing.getPairedAt())
                .lastUsedAt(pairing.getLastUsedAt())
                .createdAt(pairing.getCreatedAt())
                .build();
    }
}