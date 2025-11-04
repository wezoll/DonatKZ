package kz.donatkz.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import kz.donatkz.backend.dto.*;
import kz.donatkz.backend.exception.BadRequestException;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.service.WebSocketApiKeyService;
import kz.donatkz.backend.service.GoalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final WebSocketApiKeyService webSocketApiKeyService;
    private final GoalService goalService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    /**
     * GET /api/user/profile
     * Получить профиль текущего пользователя
     */
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUserFromDetails(userDetails);

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
                "channelUrl", user.getChannelUrl() != null ? user.getChannelUrl() : "",
                "kaspiPhone", user.getKaspiPhone() != null ? user.getKaspiPhone() : "",
                "role", user.getRole() != null ? user.getRole() : "USER",
                "subscriptionTier", user.getSubscriptionTier()
        ));
    }

    /**
     * PUT /api/user/kaspi-phone
     * Обновить номер телефона Kaspi
     */
    @PutMapping("/kaspi-phone")
    public ResponseEntity<Map<String, String>> updateKaspiPhone(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request
    ) {
        User user = getUserFromDetails(userDetails);

        String kaspiPhone = request.get("kaspiPhone");
        if (kaspiPhone == null || kaspiPhone.trim().isEmpty()) {
            throw new BadRequestException("Номер телефона не может быть пустым");
        }

        user.setKaspiPhone(kaspiPhone);
        userRepository.save(user);

        log.info("Kaspi phone updated for user: {}", user.getUsername());

        return ResponseEntity.ok(Map.of("message", "Номер телефона успешно обновлен"));
    }

    /**
     * PUT /api/user/email
     * Обновить email пользователя
     */
    @PutMapping("/email")
    public ResponseEntity<Map<String, String>> updateEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateEmailRequest request
    ) {
        User user = getUserFromDetails(userDetails);

        // Проверить, не занят ли email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Этот email уже используется другим пользователем");
        }

        user.setEmail(request.getEmail());
        userRepository.save(user);

        log.info("Email updated for user: {} to {}", user.getUsername(), request.getEmail());

        return ResponseEntity.ok(Map.of("message", "Email успешно обновлен"));
    }

    /**
     * PUT /api/user/password
     * Изменить пароль пользователя
     */
    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        User user = getUserFromDetails(userDetails);

        // Проверить текущий пароль
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Неверный текущий пароль");
        }

        // Проверить совпадение новых паролей
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Новый пароль и подтверждение не совпадают");
        }

        // Обновить пароль
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed for user: {}", user.getUsername());

        return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён"));
    }

    /**
     * GET /api/user/voice-settings
     * Получить настройки озвучки
     */
    @GetMapping("/voice-settings")
    public ResponseEntity<VoiceSettingsResponse> getVoiceSettings(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUserFromDetails(userDetails);

        boolean voiceAvailable = "BASIC".equals(user.getSubscriptionTier()) ||
                "PREMIUM".equals(user.getSubscriptionTier());

        VoiceSettingsResponse response = VoiceSettingsResponse.builder()
                .voiceEnabled(user.getVoiceEnabled() != null ? user.getVoiceEnabled() : false)
                .voiceMinAmount(user.getVoiceMinAmount())
                .voiceLanguage(user.getVoiceLanguage())
                .voiceType(user.getVoiceType() != null ? user.getVoiceType() : "robot")
                .voiceVolume(user.getVoiceVolume() != null ? user.getVoiceVolume() : 80)
                .voiceAvailable(voiceAvailable)
                .subscriptionTier(user.getSubscriptionTier())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/user/voice-settings
     * Обновить настройки озвучки
     */
    @PutMapping("/voice-settings")
    public ResponseEntity<VoiceSettingsResponse> updateVoiceSettings(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VoiceSettingsRequest request
    ) {
        User user = getUserFromDetails(userDetails);

        // Проверка тарифа
        boolean voiceAvailable = "BASIC".equals(user.getSubscriptionTier()) ||
                "PREMIUM".equals(user.getSubscriptionTier());

        if (request.getVoiceEnabled() && !voiceAvailable) {
            throw new BadRequestException(
                    "Озвучка донатов доступна только для тарифов BASIC и PREMIUM. Обновите подписку."
            );
        }

        // Обновить настройки
        user.setVoiceEnabled(request.getVoiceEnabled());
        user.setVoiceMinAmount(request.getVoiceMinAmount());
        user.setVoiceLanguage(request.getVoiceLanguage());
        user.setVoiceType(request.getVoiceType());
        user.setVoiceVolume(request.getVoiceVolume());

        userRepository.save(user);

        log.info("Voice settings updated for user: {}, enabled: {}, minAmount: {}, language: {}, type: {}, volume: {}",
                user.getUsername(), request.getVoiceEnabled(), request.getVoiceMinAmount(), request.getVoiceLanguage(),
                request.getVoiceType(), request.getVoiceVolume());

        VoiceSettingsResponse response = VoiceSettingsResponse.builder()
                .voiceEnabled(user.getVoiceEnabled())
                .voiceMinAmount(user.getVoiceMinAmount())
                .voiceLanguage(user.getVoiceLanguage())
                .voiceType(user.getVoiceType())
                .voiceVolume(user.getVoiceVolume())
                .voiceAvailable(voiceAvailable)
                .subscriptionTier(user.getSubscriptionTier())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/user/moderation-settings
     * Получить настройки модерации
     */
    @GetMapping("/moderation-settings")
    public ResponseEntity<ModerationSettingsResponse> getModerationSettings(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUserFromDetails(userDetails);

        // Парсим JSON массив запрещенных слов
        java.util.List<String> bannedWordsList;
        try {
            bannedWordsList = objectMapper.readValue(
                    user.getBannedWords() != null ? user.getBannedWords() : "[]",
                    new TypeReference<java.util.List<String>>() {}
            );
        } catch (JsonProcessingException e) {
            log.error("Failed to parse banned words for user: {}", user.getUsername(), e);
            bannedWordsList = java.util.List.of();
        }

        ModerationSettingsResponse response = ModerationSettingsResponse.builder()
                .moderationEnabled(user.getModerationEnabled() != null ? user.getModerationEnabled() : false)
                .bannedWords(bannedWordsList)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/user/moderation-settings
     * Обновить настройки модерации
     */
    @PutMapping("/moderation-settings")
    public ResponseEntity<ModerationSettingsResponse> updateModerationSettings(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ModerationSettingsRequest request
    ) {
        User user = getUserFromDetails(userDetails);

        // Сериализуем список запрещенных слов в JSON
        String bannedWordsJson;
        try {
            bannedWordsJson = objectMapper.writeValueAsString(
                    request.getBannedWords() != null ? request.getBannedWords() : java.util.List.of()
            );
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize banned words for user: {}", user.getUsername(), e);
            throw new BadRequestException("Ошибка обработки списка запрещенных слов");
        }

        // Обновить настройки
        user.setModerationEnabled(request.getModerationEnabled());
        user.setBannedWords(bannedWordsJson);

        userRepository.save(user);

        log.info("Moderation settings updated for user: {}, enabled: {}, words count: {}",
                user.getUsername(), request.getModerationEnabled(),
                request.getBannedWords() != null ? request.getBannedWords().size() : 0);

        ModerationSettingsResponse response = ModerationSettingsResponse.builder()
                .moderationEnabled(user.getModerationEnabled())
                .bannedWords(request.getBannedWords())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/user/websocket-key
     * Получить WebSocket API Key для подключения к каналу донатов
     */
    @GetMapping("/websocket-key")
    public ResponseEntity<Map<String, Object>> getWebSocketApiKey(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUserFromDetails(userDetails);

        // Если API Key еще не создан - создать
        if (user.getWebsocketApiKey() == null || user.getWebsocketApiKey().isEmpty()) {
            String apiKey = webSocketApiKeyService.generateApiKey();
            user.setWebsocketApiKey(apiKey);
            userRepository.save(user);
            log.info("Generated new WebSocket API Key for user: {}", user.getUsername());
        }

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("apiKey", user.getWebsocketApiKey());
        response.put("wsUrl", "ws://localhost:8080/ws"); // TODO: использовать реальный URL
        response.put("topic", "/topic/donations/" + user.getWebsocketApiKey());
        response.put("maskedKey", webSocketApiKeyService.maskApiKey(user.getWebsocketApiKey()));

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/user/websocket-key/regenerate
     * Регенерировать WebSocket API Key (отозвать старый)
     */
    @PostMapping("/websocket-key/regenerate")
    public ResponseEntity<Map<String, Object>> regenerateWebSocketApiKey(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUserFromDetails(userDetails);

        String oldKey = user.getWebsocketApiKey();
        String newKey = webSocketApiKeyService.generateApiKey();

        user.setWebsocketApiKey(newKey);
        userRepository.save(user);

        log.warn("WebSocket API Key regenerated for user: {}, old: {}, new: {}",
                user.getUsername(),
                webSocketApiKeyService.maskApiKey(oldKey),
                webSocketApiKeyService.maskApiKey(newKey));

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "API Key успешно обновлен. Все активные WebSocket соединения будут отключены.");
        response.put("apiKey", newKey);
        response.put("wsUrl", "ws://localhost:8080/ws");
        response.put("topic", "/topic/donations/" + newKey);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/user/goal
     * Получить первую активную цель пользователя (для обратной совместимости)
     * @deprecated Используйте /api/goals вместо этого
     */
    @GetMapping("/goal")
    @Deprecated
    public ResponseEntity<GoalDto> getGoal(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUserFromDetails(userDetails);

        // Получить первую активную цель через новый сервис
        var activeGoals = goalService.getActiveGoals(user);
        
        if (activeGoals.isEmpty()) {
            // Если нет целей, возвращаем пустую цель
            GoalDto emptyGoal = new GoalDto(
                    "НЕТ ЦЕЛИ",
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    0,
                    BigDecimal.ZERO
            );
            return ResponseEntity.ok(emptyGoal);
        }

        // Берём первую активную цель
        var goalResponse = activeGoals.get(0);
        
        GoalDto goalDto = new GoalDto(
                goalResponse.getTitle(),
                goalResponse.getTargetAmount(),
                goalResponse.getCollectedAmount(),
                goalResponse.getPercentage(),
                goalResponse.getRemaining()
        );

        return ResponseEntity.ok(goalDto);
    }

    /**
     * PUT /api/user/goal
     * Обновить цель сбора
     * @deprecated Используйте POST /api/goals для создания новых целей или PUT /api/goals/{id} для обновления
     */
    @PutMapping("/goal")
    @Deprecated
    public ResponseEntity<Map<String, String>> updateGoal(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateGoalRequest request
    ) {
        log.warn("Deprecated endpoint /api/user/goal called. Use /api/goals instead.");
        return ResponseEntity.status(410).body(
                Map.of("message", "This endpoint is deprecated. Please use /api/goals instead.")
        );
    }

    /**
     * DELETE /api/user/goal
     * Удалить цель сбора
     * @deprecated Используйте DELETE /api/goals/{id} вместо этого
     */
    @DeleteMapping("/goal")
    @Deprecated
    public ResponseEntity<Map<String, String>> deleteGoal(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.warn("Deprecated endpoint /api/user/goal called. Use /api/goals/{id} instead.");
        return ResponseEntity.status(410).body(
                Map.of("message", "This endpoint is deprecated. Please use DELETE /api/goals/{id} instead.")
        );
    }

    /**
     * Вспомогательный метод для получения User из UserDetails
     */
    private User getUserFromDetails(UserDetails userDetails) {
        String username = userDetails.getUsername();

        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
    }
}