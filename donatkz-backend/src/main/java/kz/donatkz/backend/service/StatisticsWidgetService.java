package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.DonationResponse;
import kz.donatkz.backend.dto.StatisticsWidgetCreateRequest;
import kz.donatkz.backend.dto.StatisticsWidgetResponse;
import kz.donatkz.backend.dto.StatisticsWidgetUpdateRequest;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.StatisticsWidget;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.StatisticsWidgetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsWidgetService {

    private final StatisticsWidgetRepository widgetRepository;
    private final DonationService donationService;

    /**
     * Создать новый виджет
     */
    @Transactional
    public StatisticsWidgetResponse createWidget(User user, StatisticsWidgetCreateRequest request) {
        log.info("Creating statistics widget for user: {}", user.getUsername());

        StatisticsWidget widget = StatisticsWidget.builder()
                .user(user)
                .title(request.getTitle())
                .headerText(request.getHeaderText())
                .displayType(request.getDisplayType())
                .dataType(request.getDataType())
                .period(request.getPeriod())
                .elementsCount(request.getElementsCount())
                .widgetSpeed(request.getWidgetSpeed())
                .template(request.getTemplate())
                .secondTemplate(request.getSecondTemplate())
                .position(request.getPosition())
                .mainTextStyle(request.getMainTextStyle())
                .secondaryTextStyle(request.getSecondaryTextStyle())
                .headerBackground(request.getHeaderBackground())
                .itemBackground(request.getItemBackground())
                .build();

        StatisticsWidget savedWidget = widgetRepository.save(widget);
        log.info("Statistics widget created with ID: {}", savedWidget.getId());

        return convertToResponse(savedWidget);
    }

    /**
     * Получить все виджеты пользователя
     */
    @Transactional(readOnly = true)
    public List<StatisticsWidgetResponse> getUserWidgets(User user) {
        log.info("Fetching statistics widgets for user: {}", user.getUsername());
        
        List<StatisticsWidget> widgets = widgetRepository.findByUserOrderByCreatedAtDesc(user);
        
        return widgets.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Получить виджет по ID
     */
    @Transactional(readOnly = true)
    public StatisticsWidgetResponse getWidgetById(User user, Long widgetId) {
        StatisticsWidget widget = widgetRepository.findByIdAndUser(widgetId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Виджет не найден"));
        
        return convertToResponse(widget);
    }

    /**
     * Получить виджет для публичного отображения (для OBS) с проверкой API ключа
     */
    @Transactional(readOnly = true)
    public StatisticsWidgetResponse getWidgetForDisplayByApiKey(String apiKey, Long widgetId) {
        log.info("Fetching widget {} for display with API key: {}", widgetId, apiKey.substring(0, 8) + "...");

        // Найти виджет по ID
        StatisticsWidget widget = widgetRepository.findById(widgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Виджет не найден"));

        // Проверить, что API ключ совпадает с владельцем виджета
        User widgetOwner = widget.getUser();
        if (!apiKey.equals(widgetOwner.getWebsocketApiKey())) {
            throw new ResourceNotFoundException("Неверный API ключ для этого виджета");
        }

        return convertToResponse(widget);
    }

    /**
     * Получить виджет для публичного отображения (для OBS)
     * @deprecated Используйте getWidgetForDisplayByApiKey
     */
    @Deprecated
    @Transactional(readOnly = true)
    public StatisticsWidgetResponse getWidgetForDisplay(Long widgetId) {
        StatisticsWidget widget = widgetRepository.findById(widgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Виджет не найден"));
        
        return convertToResponse(widget);
    }

    /**
     * Обновить виджет
     */
    @Transactional
    public StatisticsWidgetResponse updateWidget(User user, Long widgetId, StatisticsWidgetUpdateRequest request) {
        log.info("Updating statistics widget {} for user: {}", widgetId, user.getUsername());

        StatisticsWidget widget = widgetRepository.findByIdAndUser(widgetId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Виджет не найден"));

        if (request.getTitle() != null) widget.setTitle(request.getTitle());
        if (request.getHeaderText() != null) widget.setHeaderText(request.getHeaderText());
        if (request.getDisplayType() != null) widget.setDisplayType(request.getDisplayType());
        if (request.getDataType() != null) widget.setDataType(request.getDataType());
        if (request.getPeriod() != null) widget.setPeriod(request.getPeriod());
        if (request.getElementsCount() != null) widget.setElementsCount(request.getElementsCount());
        if (request.getWidgetSpeed() != null) widget.setWidgetSpeed(request.getWidgetSpeed());
        if (request.getTemplate() != null) widget.setTemplate(request.getTemplate());
        if (request.getSecondTemplate() != null) widget.setSecondTemplate(request.getSecondTemplate());
        if (request.getPosition() != null) widget.setPosition(request.getPosition());
        if (request.getMainTextStyle() != null) widget.setMainTextStyle(request.getMainTextStyle());
        if (request.getSecondaryTextStyle() != null) widget.setSecondaryTextStyle(request.getSecondaryTextStyle());
        if (request.getHeaderBackground() != null) widget.setHeaderBackground(request.getHeaderBackground());
        if (request.getItemBackground() != null) widget.setItemBackground(request.getItemBackground());

        StatisticsWidget updatedWidget = widgetRepository.save(widget);
        log.info("Statistics widget {} updated successfully", widgetId);

        return convertToResponse(updatedWidget);
    }

    /**
     * Удалить виджет
     */
    @Transactional
    public void deleteWidget(User user, Long widgetId) {
        log.info("Deleting statistics widget {} for user: {}", widgetId, user.getUsername());

        StatisticsWidget widget = widgetRepository.findByIdAndUser(widgetId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Виджет не найден"));

        widgetRepository.delete(widget);
        log.info("Statistics widget {} deleted successfully", widgetId);
    }

    /**
     * Получить донаты для виджета с правильной фильтрацией (для авторизованных пользователей)
     */
    @Transactional(readOnly = true)
    public List<DonationResponse> getDonationsForWidget(User user, String period, String dataType, int limit) {
        log.info("Fetching donations for widget: period={}, dataType={}, limit={}", period, dataType, limit);
        return fetchDonations(user.getId(), period, dataType, limit);
    }

    /**
     * Получить донаты для отображения виджета (публичный метод с проверкой API ключа)
     */
    @Transactional(readOnly = true)
    public List<DonationResponse> getDonationsForWidgetDisplay(String apiKey, Long widgetId) {
        log.info("Fetching donations for widget display: widgetId={}, apiKey={}", widgetId, apiKey.substring(0, 8) + "...");

        // Найти виджет по ID
        StatisticsWidget widget = widgetRepository.findById(widgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Виджет не найден"));

        // Проверить, что API ключ совпадает с владельцем виджета
        User widgetOwner = widget.getUser();
        if (!apiKey.equals(widgetOwner.getWebsocketApiKey())) {
            throw new ResourceNotFoundException("Неверный API ключ для этого виджета");
        }

        // Получить донаты
        return fetchDonations(widgetOwner.getId(), widget.getPeriod(), widget.getDataType(), widget.getElementsCount());
    }

    /**
     * Вспомогательный метод для получения донатов
     */
    private List<DonationResponse> fetchDonations(Long userId, String period, String dataType, int limit) {
        if ("recent".equals(dataType)) {
            // Последние донаты
            return donationService.getRecentDonations(userId, limit);
        } else if ("largest".equals(dataType)) {
            // Крупнейшие донаты
            return donationService.getLargestDonations(userId, period, limit);
        } else if ("most".equals(dataType)) {
            // Пользователи с наибольшей суммой донатов
            return donationService.getTopDonors(userId, period, limit).stream()
                    .map(topDonor -> DonationResponse.builder()
                            .id(0L) // Нет конкретного ID
                            .senderName(topDonor.getSenderName())
                            .amount(topDonor.getTotalAmount())
                            .message("") // Нет конкретного сообщения
                            .timestamp(null) // Нет конкретной даты
                            .build())
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    /**
     * Конвертировать StatisticsWidget в StatisticsWidgetResponse
     */
    private StatisticsWidgetResponse convertToResponse(StatisticsWidget widget) {
        String apiKey = widget.getUser().getWebsocketApiKey();
        String widgetUrl = String.format("http://localhost:5173/statistics-widget/%s/%d", apiKey, widget.getId());

        return StatisticsWidgetResponse.builder()
                .id(widget.getId())
                .title(widget.getTitle())
                .widgetUrl(widgetUrl)
                // Settings (плоская структура)
                .headerText(widget.getHeaderText())
                .displayType(widget.getDisplayType())
                .dataType(widget.getDataType())
                .period(widget.getPeriod())
                .elementsCount(widget.getElementsCount())
                .widgetSpeed(widget.getWidgetSpeed())
                .template(widget.getTemplate())
                .secondTemplate(widget.getSecondTemplate())
                // Design (плоская структура)
                .position(widget.getPosition())
                .mainTextStyle(widget.getMainTextStyle())
                .secondaryTextStyle(widget.getSecondaryTextStyle())
                .headerBackground(widget.getHeaderBackground())
                .itemBackground(widget.getItemBackground())
                // Timestamps
                .createdAt(widget.getCreatedAt())
                .updatedAt(widget.getUpdatedAt())
                .build();
    }
}

