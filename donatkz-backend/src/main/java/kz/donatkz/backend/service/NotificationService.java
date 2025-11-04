package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.NotificationDto;
import kz.donatkz.backend.exception.BadRequestException;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.Notification;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Получить все уведомления пользователя
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(User user) {
        List<Notification> notifications = notificationRepository
                .findByUserIdOrderByMinAmountAsc(user.getId());

        return notifications.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Получить уведомление по ID
     */
    @Transactional(readOnly = true)
    public NotificationDto getNotification(User user, Long notificationId) {
        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Уведомление не найдено"));

        return mapToDto(notification);
    }

    /**
     * Создать новое уведомление
     */
    @Transactional
    public NotificationDto createNotification(User user, NotificationDto dto) {
        log.info("Creating notification for user: {}, name: {}", user.getUsername(), dto.getName());

        // Генерируем уникальный URL для виджета
        String widgetUrl = generateWidgetUrl();

        Notification notification = new Notification();
        notification.setUserId(user.getId());
        notification.setName(dto.getName());
        notification.setMinAmount(dto.getMinAmount());
        notification.setIsEnabled(dto.getIsEnabled() != null ? dto.getIsEnabled() : true);
        notification.setWidgetUrl(widgetUrl);

        // Настройки по умолчанию
        setDefaultSettings(notification, dto);

        notification = notificationRepository.save(notification);

        log.info("Notification created: id={}, widgetUrl={}", notification.getId(), widgetUrl);

        return mapToDto(notification);
    }

    /**
     * Обновить уведомление
     */
    @Transactional
    public NotificationDto updateNotification(User user, Long notificationId, NotificationDto dto) {
        log.info("Updating notification: id={}, user={}", notificationId, user.getUsername());

        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Уведомление не найдено"));

        // Обновляем поля
        notification.setName(dto.getName());
        notification.setMinAmount(dto.getMinAmount());
        notification.setIsEnabled(dto.getIsEnabled());

        // Обновляем настройки
        updateSettings(notification, dto);

        notification = notificationRepository.save(notification);

        log.info("Notification updated: id={}", notificationId);

        return mapToDto(notification);
    }

    /**
     * Удалить уведомление
     */
    @Transactional
    public void deleteNotification(User user, Long notificationId) {
        log.info("Deleting notification: id={}, user={}", notificationId, user.getUsername());

        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Уведомление не найдено"));

        notificationRepository.delete(notification);

        log.info("Notification deleted: id={}", notificationId);
    }

    /**
     * Включить/выключить уведомление
     */
    @Transactional
    public NotificationDto toggleNotification(User user, Long notificationId) {
        log.info("Toggling notification: id={}, user={}", notificationId, user.getUsername());

        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Уведомление не найдено"));

        notification.setIsEnabled(!notification.getIsEnabled());
        notification = notificationRepository.save(notification);

        log.info("Notification toggled: id={}, enabled={}", notificationId, notification.getIsEnabled());

        return mapToDto(notification);
    }

    /**
     * Установить настройки по умолчанию
     */
    private void setDefaultSettings(Notification notification, NotificationDto dto) {
        // Изображение/GIF
        notification.setGifUrl(dto.getGifUrl() != null ? dto.getGifUrl() : "/gifs/donate1.gif");
        notification.setGifType(dto.getGifType() != null ? dto.getGifType() : "preset");

        // Звук
        notification.setSoundUrl(dto.getSoundUrl() != null ? dto.getSoundUrl() : "/sounds/donate1_sound.mp3");
        notification.setSoundType(dto.getSoundType() != null ? dto.getSoundType() : "preset");

        // Настройки отображения
        notification.setDisplayDuration(dto.getDisplayDuration() != null ? dto.getDisplayDuration() : 7);
        notification.setVolume(dto.getVolume() != null ? dto.getVolume() : 100);
        notification.setEnterAnimation(dto.getEnterAnimation() != null ? dto.getEnterAnimation() : "left");
        notification.setExitAnimation(dto.getExitAnimation() != null ? dto.getExitAnimation() : "left");

        // Шаблоны текста
        notification.setTitleTemplate(dto.getTitleTemplate() != null ? dto.getTitleTemplate() : "{username} - {amount}!");
        notification.setMessageTemplate(dto.getMessageTemplate() != null ? dto.getMessageTemplate() : "{message}");

        // Стили заголовка
        if (dto.getTitleText() != null) {
            NotificationDto.TextStyleDto titleText = dto.getTitleText();
            notification.setTitleFontFamily(titleText.getFontFamily());
            notification.setTitleFontSize(titleText.getFontSize());
            notification.setTitleTextColor(titleText.getTextColor());
            notification.setTitleIsBold(titleText.getIsBold());
            notification.setTitleIsItalic(titleText.getIsItalic());
            notification.setTitleIsUnderline(titleText.getIsUnderline());
            notification.setTitleTransform(titleText.getTransform());
            notification.setTitleAlignment(titleText.getAlignment());
        }

        // Стили сообщения
        if (dto.getMessageText() != null) {
            NotificationDto.TextStyleDto messageText = dto.getMessageText();
            notification.setMessageFontFamily(messageText.getFontFamily());
            notification.setMessageFontSize(messageText.getFontSize());
            notification.setMessageTextColor(messageText.getTextColor());
            notification.setMessageIsBold(messageText.getIsBold());
            notification.setMessageIsItalic(messageText.getIsItalic());
            notification.setMessageIsUnderline(messageText.getIsUnderline());
            notification.setMessageTransform(messageText.getTransform());
            notification.setMessageAlignment(messageText.getAlignment());
        }
    }

    /**
     * Обновить настройки уведомления
     */
    private void updateSettings(Notification notification, NotificationDto dto) {
        if (dto.getGifUrl() != null) notification.setGifUrl(dto.getGifUrl());
        if (dto.getGifType() != null) notification.setGifType(dto.getGifType());
        if (dto.getSoundUrl() != null) notification.setSoundUrl(dto.getSoundUrl());
        if (dto.getSoundType() != null) notification.setSoundType(dto.getSoundType());
        if (dto.getDisplayDuration() != null) notification.setDisplayDuration(dto.getDisplayDuration());
        if (dto.getVolume() != null) notification.setVolume(dto.getVolume());
        if (dto.getEnterAnimation() != null) notification.setEnterAnimation(dto.getEnterAnimation());
        if (dto.getExitAnimation() != null) notification.setExitAnimation(dto.getExitAnimation());
        if (dto.getTitleTemplate() != null) notification.setTitleTemplate(dto.getTitleTemplate());
        if (dto.getMessageTemplate() != null) notification.setMessageTemplate(dto.getMessageTemplate());

        // Обновляем стили заголовка
        if (dto.getTitleText() != null) {
            NotificationDto.TextStyleDto titleText = dto.getTitleText();
            if (titleText.getFontFamily() != null) notification.setTitleFontFamily(titleText.getFontFamily());
            if (titleText.getFontSize() != null) notification.setTitleFontSize(titleText.getFontSize());
            if (titleText.getTextColor() != null) notification.setTitleTextColor(titleText.getTextColor());
            if (titleText.getIsBold() != null) notification.setTitleIsBold(titleText.getIsBold());
            if (titleText.getIsItalic() != null) notification.setTitleIsItalic(titleText.getIsItalic());
            if (titleText.getIsUnderline() != null) notification.setTitleIsUnderline(titleText.getIsUnderline());
            if (titleText.getTransform() != null) notification.setTitleTransform(titleText.getTransform());
            if (titleText.getAlignment() != null) notification.setTitleAlignment(titleText.getAlignment());
        }

        // Обновляем стили сообщения
        if (dto.getMessageText() != null) {
            NotificationDto.TextStyleDto messageText = dto.getMessageText();
            if (messageText.getFontFamily() != null) notification.setMessageFontFamily(messageText.getFontFamily());
            if (messageText.getFontSize() != null) notification.setMessageFontSize(messageText.getFontSize());
            if (messageText.getTextColor() != null) notification.setMessageTextColor(messageText.getTextColor());
            if (messageText.getIsBold() != null) notification.setMessageIsBold(messageText.getIsBold());
            if (messageText.getIsItalic() != null) notification.setMessageIsItalic(messageText.getIsItalic());
            if (messageText.getIsUnderline() != null) notification.setMessageIsUnderline(messageText.getIsUnderline());
            if (messageText.getTransform() != null) notification.setMessageTransform(messageText.getTransform());
            if (messageText.getAlignment() != null) notification.setMessageAlignment(messageText.getAlignment());
        }
    }

    /**
     * Маппинг Notification -> NotificationDto
     */
    private NotificationDto mapToDto(Notification notification) {
        NotificationDto.TextStyleDto titleText = NotificationDto.TextStyleDto.builder()
                .fontFamily(notification.getTitleFontFamily())
                .fontSize(notification.getTitleFontSize())
                .textColor(notification.getTitleTextColor())
                .isBold(notification.getTitleIsBold())
                .isItalic(notification.getTitleIsItalic())
                .isUnderline(notification.getTitleIsUnderline())
                .transform(notification.getTitleTransform())
                .alignment(notification.getTitleAlignment())
                .build();

        NotificationDto.TextStyleDto messageText = NotificationDto.TextStyleDto.builder()
                .fontFamily(notification.getMessageFontFamily())
                .fontSize(notification.getMessageFontSize())
                .textColor(notification.getMessageTextColor())
                .isBold(notification.getMessageIsBold())
                .isItalic(notification.getMessageIsItalic())
                .isUnderline(notification.getMessageIsUnderline())
                .transform(notification.getMessageTransform())
                .alignment(notification.getMessageAlignment())
                .build();

        return NotificationDto.builder()
                .id(notification.getId())
                .name(notification.getName())
                .minAmount(notification.getMinAmount())
                .isEnabled(notification.getIsEnabled())
                .widgetUrl(notification.getWidgetUrl())
                .gifUrl(notification.getGifUrl())
                .gifType(notification.getGifType())
                .soundUrl(notification.getSoundUrl())
                .soundType(notification.getSoundType())
                .displayDuration(notification.getDisplayDuration())
                .volume(notification.getVolume())
                .enterAnimation(notification.getEnterAnimation())
                .exitAnimation(notification.getExitAnimation())
                .titleTemplate(notification.getTitleTemplate())
                .messageTemplate(notification.getMessageTemplate())
                .titleText(titleText)
                .messageText(messageText)
                .build();
    }

    /**
     * Генерация уникального URL для виджета
     */
    private String generateWidgetUrl() {
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("https://widget.donatkz.com/notification-%s", uuid);
    }
}