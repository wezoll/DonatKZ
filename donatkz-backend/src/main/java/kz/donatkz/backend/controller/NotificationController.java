package kz.donatkz.backend.controller;

import jakarta.validation.Valid;
import kz.donatkz.backend.dto.NotificationDto;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API для управления уведомлениями виджетов
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * GET /api/notifications
     * Получить список всех уведомлений пользователя
     */
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getUserNotifications(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        log.info("Getting notifications for user: {}", user.getUsername());

        List<NotificationDto> notifications = notificationService.getUserNotifications(user);

        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/notifications/{id}
     * Получить конкретное уведомление
     */
    @GetMapping("/{id}")
    public ResponseEntity<NotificationDto> getNotification(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User user = getUserFromAuthentication(authentication);
        log.info("Getting notification: id={}, user={}", id, user.getUsername());

        NotificationDto notification = notificationService.getNotification(user, id);

        return ResponseEntity.ok(notification);
    }

    /**
     * POST /api/notifications
     * Создать новое уведомление
     */
    @PostMapping
    public ResponseEntity<NotificationDto> createNotification(
            Authentication authentication,
            @Valid @RequestBody NotificationDto dto
    ) {
        User user = getUserFromAuthentication(authentication);
        log.info("Creating notification for user: {}, name: {}", user.getUsername(), dto.getName());

        NotificationDto notification = notificationService.createNotification(user, dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(notification);
    }

    /**
     * PUT /api/notifications/{id}
     * Обновить уведомление
     */
    @PutMapping("/{id}")
    public ResponseEntity<NotificationDto> updateNotification(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody NotificationDto dto
    ) {
        User user = getUserFromAuthentication(authentication);
        log.info("Updating notification: id={}, user={}", id, user.getUsername());

        NotificationDto notification = notificationService.updateNotification(user, id, dto);

        return ResponseEntity.ok(notification);
    }

    /**
     * DELETE /api/notifications/{id}
     * Удалить уведомление
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User user = getUserFromAuthentication(authentication);
        log.info("Deleting notification: id={}, user={}", id, user.getUsername());

        notificationService.deleteNotification(user, id);

        return ResponseEntity.ok(Map.of("message", "Уведомление успешно удалено"));
    }

    /**
     * PATCH /api/notifications/{id}/toggle
     * Включить/выключить уведомление
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<NotificationDto> toggleNotification(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User user = getUserFromAuthentication(authentication);
        log.info("Toggling notification: id={}, user={}", id, user.getUsername());

        NotificationDto notification = notificationService.toggleNotification(user, id);

        return ResponseEntity.ok(notification);
    }

    /**
     * Получить пользователя из Authentication
     */
    private User getUserFromAuthentication(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
    }
}