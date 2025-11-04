package kz.donatkz.backend.controller;

import jakarta.validation.Valid;
import kz.donatkz.backend.dto.DonationResponse;
import kz.donatkz.backend.dto.StatisticsWidgetCreateRequest;
import kz.donatkz.backend.dto.StatisticsWidgetResponse;
import kz.donatkz.backend.dto.StatisticsWidgetUpdateRequest;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.service.StatisticsWidgetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/statistics-widgets")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StatisticsWidgetController {

    private final StatisticsWidgetService widgetService;
    private final UserRepository userRepository;

    /**
     * Создать новый виджет статистики
     * POST /api/statistics-widgets
     */
    @PostMapping
    public ResponseEntity<StatisticsWidgetResponse> createWidget(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StatisticsWidgetCreateRequest request) {
        
        User user = getUserFromDetails(userDetails);
        log.info("Creating statistics widget for user: {}", user.getUsername());
        StatisticsWidgetResponse response = widgetService.createWidget(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Получить все виджеты текущего пользователя
     * GET /api/statistics-widgets
     */
    @GetMapping
    public ResponseEntity<List<StatisticsWidgetResponse>> getUserWidgets(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUserFromDetails(userDetails);
        log.info("Fetching statistics widgets for user: {}", user.getUsername());
        List<StatisticsWidgetResponse> widgets = widgetService.getUserWidgets(user);
        return ResponseEntity.ok(widgets);
    }

    /**
     * Получить виджет по ID
     * GET /api/statistics-widgets/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<StatisticsWidgetResponse> getWidgetById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        
        User user = getUserFromDetails(userDetails);
        log.info("Fetching statistics widget {} for user: {}", id, user.getUsername());
        StatisticsWidgetResponse widget = widgetService.getWidgetById(user, id);
        return ResponseEntity.ok(widget);
    }

    /**
     * Получить данные для виджета (публичный endpoint для OBS)
     * GET /api/statistics-widgets/display/{apiKey}/{id}
     */
    @GetMapping("/display/{apiKey}/{id}")
    public ResponseEntity<StatisticsWidgetResponse> getWidgetForDisplay(
            @PathVariable String apiKey,
            @PathVariable Long id) {
        log.info("Fetching statistics widget data for display: {} with API key", id);
        StatisticsWidgetResponse widget = widgetService.getWidgetForDisplayByApiKey(apiKey, id);
        return ResponseEntity.ok(widget);
    }
    
    /**
     * Получить данные для виджета (старый endpoint без API ключа)
     * @deprecated Используйте /display/{apiKey}/{id}
     */
    @Deprecated
    @GetMapping("/display/{id}")
    public ResponseEntity<StatisticsWidgetResponse> getWidgetForDisplayOld(@PathVariable Long id) {
        log.warn("Deprecated endpoint /api/statistics-widgets/display/{} called", id);
        StatisticsWidgetResponse widget = widgetService.getWidgetForDisplay(id);
        return ResponseEntity.ok(widget);
    }

    /**
     * Обновить виджет
     * PUT /api/statistics-widgets/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<StatisticsWidgetResponse> updateWidget(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody StatisticsWidgetUpdateRequest request) {
        
        User user = getUserFromDetails(userDetails);
        log.info("Updating statistics widget {} for user: {}", id, user.getUsername());
        StatisticsWidgetResponse widget = widgetService.updateWidget(user, id, request);
        return ResponseEntity.ok(widget);
    }

    /**
     * Удалить виджет
     * DELETE /api/statistics-widgets/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWidget(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        
        User user = getUserFromDetails(userDetails);
        log.info("Deleting statistics widget {} for user: {}", id, user.getUsername());
        widgetService.deleteWidget(user, id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Получить донаты для превью виджета (с правильной фильтрацией) - авторизованный endpoint
     * GET /api/statistics-widgets/donations
     */
    @GetMapping("/donations")
    public ResponseEntity<List<DonationResponse>> getDonationsForWidget(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String period,
            @RequestParam String dataType,
            @RequestParam(defaultValue = "5") int limit
    ) {
        User user = getUserFromDetails(userDetails);
        log.info("Fetching donations for widget preview for user: {}, period: {}, dataType: {}, limit: {}",
                user.getUsername(), period, dataType, limit);
        
        List<DonationResponse> donations = widgetService.getDonationsForWidget(user, period, dataType, limit);
        return ResponseEntity.ok(donations);
    }

    /**
     * Получить донаты для отображения виджета (публичный endpoint для OBS)
     * GET /api/statistics-widgets/display/{apiKey}/{id}/donations
     */
    @GetMapping("/display/{apiKey}/{id}/donations")
    public ResponseEntity<List<DonationResponse>> getDonationsForWidgetDisplay(
            @PathVariable String apiKey,
            @PathVariable Long id
    ) {
        log.info("Fetching donations for widget display: widgetId={}, apiKey={}", id, apiKey.substring(0, 8) + "...");
        
        List<DonationResponse> donations = widgetService.getDonationsForWidgetDisplay(apiKey, id);
        return ResponseEntity.ok(donations);
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

