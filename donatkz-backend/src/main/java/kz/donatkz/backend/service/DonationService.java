package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.*;
import kz.donatkz.backend.exception.BadRequestException;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.Donation;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.DonationRepository;
import kz.donatkz.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DonationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final DeduplicationService deduplicationService;
    private final SubscriptionValidationService subscriptionValidationService;
    private final DonationWebSocketService donationWebSocketService;

    /**
     * Создание нового доната (от Desktop App)
     */
    @Transactional
    public DonationResponse createDonation(Long userId, DonationRequest request) {
        log.info("Creating donation for user: {}, amount: {}, sender: {}",
                userId, request.getAmount(), request.getSenderName());

        // 1. Получить пользователя
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        // 2. Проверить подписку и лимиты
        subscriptionValidationService.validateSubscription(user);

        // 3. Проверить дубликат
        String hash = deduplicationService.generateHash(
                userId,
                request.getAmount(),
                request.getSenderName(),
                request.getTimestamp());

        if (deduplicationService.isDuplicate(hash)) {
            log.warn("Duplicate donation detected: hash={}", hash);

            // Вернуть существующий донат
            Donation existingDonation = donationRepository.findByDeduplicationHash(hash);
            return mapToResponse(existingDonation);
        }

        // 4. Backend решает, озвучивать ли донат на основе настроек пользователя
        boolean voiceEnabled = shouldVoiceDonation(user, request.getAmount());

        // 5. Создать донат
        Donation donation = new Donation();
        donation.setUserId(userId);
        donation.setAmount(request.getAmount());
        donation.setSenderName(request.getSenderName());
        donation.setMessage(request.getMessage());
        donation.setTimestamp(request.getTimestamp());
        donation.setRawNotificationText(request.getRawNotificationText());
        donation.setDeduplicationHash(hash);
        donation.setStatus(Donation.DonationStatus.PROCESSED);
        donation.setIsProcessed(true);
        donation.setVoiceEnabled(voiceEnabled);

        donation = donationRepository.save(donation);

        // 6. Увеличить счетчик для FREE тарифа
        subscriptionValidationService.incrementDonationCount(user);

        log.info("Donation created successfully: id={}, userId={}, amount={}",
                donation.getId(), userId, donation.getAmount());

        // 7. Отправить через WebSocket на Frontend/OBS в реальном времени
        DonationResponse response = mapToResponse(donation);

        // Используем API Key пользователя вместо userId для безопасности
        if (user.getWebsocketApiKey() != null && !user.getWebsocketApiKey().isEmpty()) {
            donationWebSocketService.sendNewDonationNotification(response, user, user.getWebsocketApiKey());
        } else {
            log.warn("User {} has no WebSocket API Key, skipping WebSocket notification", userId);
        }

        return response;
    }

    /**
     * Получить донаты с пагинацией
     */
    public Page<DonationResponse> getDonations(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Donation> donations = donationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return donations.map(this::mapToResponse);
    }

    /**
     * Получить последние N донатов
     */
    public List<DonationResponse> getRecentDonations(Long userId, int limit) {
        // Используем метод из репозитория (Top10)
        List<Donation> donations = donationRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId);

        // Если нужно больше 10, можно использовать Pageable
        List<DonationResponse> responses = new ArrayList<>();
        for (Donation donation : donations) {
            responses.add(mapToResponse(donation));
            if (responses.size() >= limit) {
                break;
            }
        }

        return responses;
    }

    /**
     * Получить крупнейшие донаты
     */
    public List<DonationResponse> getLargestDonations(Long userId, String period, int limit) {
        log.info("Fetching largest donations for user: {}, period: {}, limit: {}", userId, period, limit);

        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "amount"));

        Page<Donation> donations;
        if ("all-time".equals(period)) {
            donations = donationRepository.findByUserIdOrderByAmountDesc(userId, pageable);
        } else {
            LocalDateTime startDate;
            switch (period.toLowerCase()) {
                case "today":
                    startDate = LocalDate.now().atStartOfDay();
                    break;
                case "week":
                    startDate = LocalDate.now().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                            .atStartOfDay();
                    break;
                case "month":
                    startDate = LocalDate.now().withDayOfMonth(1).atStartOfDay();
                    break;
                case "year":
                    startDate = LocalDate.now().withDayOfYear(1).atStartOfDay();
                    break;
                default:
                    startDate = LocalDate.now().minusMonths(1).atStartOfDay();
            }

            LocalDateTime endDate = LocalDateTime.now();
            donations = donationRepository.findByUserIdAndCreatedAtBetweenOrderByAmountDesc(
                    userId, startDate, endDate, pageable);
        }

        return donations.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Получить статистику донатов
     */
    public DonationStatsDto getDonationStats(Long userId) {
        // Общая статистика
        Long totalCount = donationRepository.countByUserId(userId);
        BigDecimal totalAmount = donationRepository.getTotalAmountByUserId(userId);
        BigDecimal averageAmount = donationRepository.getAverageAmountByUserId(userId);
        BigDecimal maxAmount = donationRepository.getMaxAmountByUserId(userId);

        // Статистика за сегодня
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        List<Donation> todayDonations = donationRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                userId, todayStart, todayEnd);
        Long countToday = (long) todayDonations.size();
        BigDecimal amountToday = todayDonations.stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Статистика за неделю
        LocalDateTime weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                .atStartOfDay();
        LocalDateTime weekEnd = LocalDateTime.now();
        List<Donation> weekDonations = donationRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                userId, weekStart, weekEnd);
        Long countThisWeek = (long) weekDonations.size();
        BigDecimal amountThisWeek = weekDonations.stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Статистика за месяц
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = LocalDateTime.now();
        List<Donation> monthDonations = donationRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                userId, monthStart, monthEnd);
        Long countThisMonth = (long) monthDonations.size();
        BigDecimal amountThisMonth = monthDonations.stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return DonationStatsDto.builder()
                .totalCount(totalCount)
                .totalAmount(totalAmount.setScale(2, RoundingMode.HALF_UP))
                .averageAmount(averageAmount.setScale(2, RoundingMode.HALF_UP))
                .maxAmount(maxAmount.setScale(2, RoundingMode.HALF_UP))
                .countToday(countToday)
                .amountToday(amountToday.setScale(2, RoundingMode.HALF_UP))
                .countThisWeek(countThisWeek)
                .amountThisWeek(amountThisWeek.setScale(2, RoundingMode.HALF_UP))
                .countThisMonth(countThisMonth)
                .amountThisMonth(amountThisMonth.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    /**
     * Получить топ донатеров за период
     */
    public List<TopDonorDto> getTopDonors(Long userId, String period, int limit) {
        List<Object[]> results;
        Pageable pageable = PageRequest.of(0, limit);

        switch (period.toUpperCase()) {
            case "TODAY":
                LocalDateTime todayStart = LocalDate.now().atStartOfDay();
                LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
                results = donationRepository.getTopDonorsByUserIdAndPeriod(userId, todayStart, todayEnd, pageable);
                break;

            case "WEEK":
                LocalDateTime weekStart = LocalDate.now()
                        .with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)).atStartOfDay();
                LocalDateTime weekEnd = LocalDateTime.now();
                results = donationRepository.getTopDonorsByUserIdAndPeriod(userId, weekStart, weekEnd, pageable);
                break;

            case "MONTH":
                LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
                LocalDateTime monthEnd = LocalDateTime.now();
                results = donationRepository.getTopDonorsByUserIdAndPeriod(userId, monthStart, monthEnd, pageable);
                break;

            case "ALL_TIME":
            default:
                results = donationRepository.getTopDonorsByUserId(userId, pageable);
                break;
        }

        List<TopDonorDto> topDonors = new ArrayList<>();
        int rank = 1;
        for (Object[] result : results) {
            String senderName = (String) result[0];
            BigDecimal totalAmount = (BigDecimal) result[1];
            Long count = (Long) result[2];

            topDonors.add(TopDonorDto.builder()
                    .senderName(senderName)
                    .totalAmount(totalAmount.setScale(2, RoundingMode.HALF_UP))
                    .donationCount(count)
                    .rank(rank++)
                    .build());
        }

        return topDonors;
    }

    /**
     * Маппинг Donation -> DonationResponse
     */
    private DonationResponse mapToResponse(Donation donation) {
        return DonationResponse.builder()
                .id(donation.getId())
                .amount(donation.getAmount())
                .senderName(donation.getSenderName())
                .message(donation.getMessage())
                .timestamp(donation.getTimestamp())
                .status(donation.getStatus().name())
                .voiceEnabled(donation.getVoiceEnabled())
                .createdAt(donation.getCreatedAt())
                .build();
    }

    /**
     * Определить, нужно ли озвучивать донат на основе настроек пользователя
     */
    private boolean shouldVoiceDonation(User user, BigDecimal amount) {
        // 1. Проверка тарифа (озвучка только для BASIC/PREMIUM)
        if (!"BASIC".equals(user.getSubscriptionTier()) &&
                !"PREMIUM".equals(user.getSubscriptionTier())) {
            log.debug("Voice disabled: user {} has {} subscription",
                    user.getUsername(), user.getSubscriptionTier());
            return false;
        }

        // 2. Проверка глобальной настройки пользователя
        if (!Boolean.TRUE.equals(user.getVoiceEnabled())) {
            log.debug("Voice disabled: user {} has voice turned off in settings", user.getUsername());
            return false;
        }

        // 3. Проверка минимальной суммы
        if (user.getVoiceMinAmount() != null &&
                amount.compareTo(user.getVoiceMinAmount()) < 0) {
            log.debug("Voice disabled: amount {} is below minimum {}",
                    amount, user.getVoiceMinAmount());
            return false;
        }

        log.debug("Voice enabled for donation: user={}, amount={}", user.getUsername(), amount);
        return true; // ✅ Озвучить
    }
}