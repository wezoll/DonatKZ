package kz.donatkz.backend.controller;

import kz.donatkz.backend.dto.DonationResponse;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.service.DonationWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * WebSocket Test Controller
 * Для тестирования WebSocket соединений
 */
@RestController
@RequestMapping("/api/websocket")
@RequiredArgsConstructor
@Slf4j
public class WebSocketTestController {

    private final DonationWebSocketService donationWebSocketService;
    private final UserRepository userRepository;

    /**
     * POST /api/websocket/test
     * Отправить тестовое WebSocket сообщение (тестовый донат)
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> sendTestDonation(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // Получить текущего пользователя
        User user = userRepository.findByUsername(userDetails.getUsername())
                .or(() -> userRepository.findByEmail(userDetails.getUsername()))
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        // Проверить что у пользователя есть API Key
        if (user.getWebsocketApiKey() == null || user.getWebsocketApiKey().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "У пользователя нет WebSocket API Key. Получите его через GET /api/user/websocket-key"
            ));
        }

        // Создать тестовый донат
        DonationResponse testDonation = DonationResponse.builder()
                .id(999L)
                .amount(new BigDecimal("500.00"))
                .senderName("Тестовый донат")
                .message("Это тестовое сообщение из WebSocket Test Controller! 🚀")
                .timestamp(LocalDateTime.now())
                .status("PROCESSED")
                .voiceEnabled(false)
                .createdAt(LocalDateTime.now())
                .build();

        // Отправить через WebSocket
        donationWebSocketService.sendNewDonationNotification(testDonation, user, user.getWebsocketApiKey());

        log.info("Test donation sent via WebSocket to user: {}, apiKey: {}...",
                user.getUsername(), user.getWebsocketApiKey().substring(0, 8));

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Тестовый донат отправлен через WebSocket!",
                "apiKey", user.getWebsocketApiKey().substring(0, 8) + "...",
                "topic", "/topic/donations/" + user.getWebsocketApiKey(),
                "donation", testDonation
        ));
    }

    /**
     * GET /api/websocket/info
     * Получить информацию о WebSocket подключении
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getWebSocketInfo(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .or(() -> userRepository.findByEmail(userDetails.getUsername()))
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        boolean hasApiKey = user.getWebsocketApiKey() != null && !user.getWebsocketApiKey().isEmpty();

        Map<String, Object> info = new java.util.HashMap<>();
        info.put("hasApiKey", hasApiKey);
        info.put("wsUrl", "ws://localhost:8080/ws");

        if (hasApiKey) {
            info.put("topic", "/topic/donations/" + user.getWebsocketApiKey());
            info.put("maskedApiKey", user.getWebsocketApiKey().substring(0, 8) + "...");
            info.put("connectionGuide", Map.of(
                    "step1", "Подключиться к ws://localhost:8080/ws используя SockJS",
                    "step2", "Использовать STOMP протокол",
                    "step3", "Подписаться на /topic/donations/" + user.getWebsocketApiKey(),
                    "step4", "Получать донаты в реальном времени!"
            ));
        } else {
            info.put("message", "API Key не создан. Получите его через GET /api/user/websocket-key");
        }

        return ResponseEntity.ok(info);
    }
}