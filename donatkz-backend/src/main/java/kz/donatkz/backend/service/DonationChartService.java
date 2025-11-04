package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.ChartDataPointDto;
import kz.donatkz.backend.dto.DonationDto;
import kz.donatkz.backend.dto.DonationStatsDashboardDto;
import kz.donatkz.backend.model.Donation;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.DonationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Сервис для получения данных донатов для Dashboard (графики, статистика)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DonationChartService {

    private final DonationRepository donationRepository;

    /**
     * Получить список донатов с пагинацией
     */
    @Transactional(readOnly = true)
    public Page<DonationDto> getDonations(User user, String period, int page, int size) {
        LocalDateTime startDate = getStartDateFromPeriod(period);
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());

        Page<Donation> donations = donationRepository.findByUserAndTimestampAfter(
                user, startDate, pageable
        );

        return donations.map(this::mapToDto);
    }

    /**
     * Получить статистику донатов за период
     */
    @Transactional(readOnly = true)
    public DonationStatsDashboardDto getStatistics(User user, String period) {
        LocalDateTime startDate = getStartDateFromPeriod(period);

        List<Donation> donations = donationRepository.findByUserAndTimestampAfter(user, startDate);

        long totalCount = donations.size();
        BigDecimal totalAmount = donations.stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageAmount = totalCount > 0
                ? totalAmount.divide(BigDecimal.valueOf(totalCount), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal maxAmount = donations.stream()
                .map(Donation::getAmount)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        return new DonationStatsDashboardDto(
                totalCount,
                totalAmount.doubleValue(),
                averageAmount.doubleValue(),
                maxAmount.doubleValue()
        );
    }

    /**
     * Получить данные для графика
     */
    @Transactional(readOnly = true)
    public List<ChartDataPointDto> getChartData(User user, String period) {
        LocalDateTime startDate = getStartDateFromPeriod(period);
        List<Donation> donations = donationRepository.findByUserAndTimestampAfter(user, startDate);

        log.info("Found {} donations for user {} in period {}", donations.size(), user.getUsername(), period);

        return aggregateChartData(donations, period);
    }

    /**
     * Агрегация данных для графика в зависимости от периода
     */
    private List<ChartDataPointDto> aggregateChartData(List<Donation> donations, String period) {
        List<ChartDataPointDto> chartData = new ArrayList<>();

        switch (period) {
            case "24h":
                chartData = aggregateByHours(donations, 24);
                break;
            case "7d":
                chartData = aggregateByDays(donations, 7);
                break;
            case "month":
                chartData = aggregateByDays(donations, 30);
                break;
            case "year":
                chartData = aggregateByMonths(donations, 12);
                break;
        }

        return chartData;
    }

    /**
     * Агрегация по часам
     */
    private List<ChartDataPointDto> aggregateByHours(List<Donation> donations, int hours) {
        LocalDateTime now = LocalDateTime.now();
        List<ChartDataPointDto> result = new ArrayList<>();

        for (int i = hours - 1; i >= 0; i--) {
            LocalDateTime hourStart = now.minusHours(i).truncatedTo(ChronoUnit.HOURS);
            LocalDateTime hourEnd = hourStart.plusHours(1);

            BigDecimal sum = donations.stream()
                    .filter(d -> !d.getTimestamp().isBefore(hourStart) && d.getTimestamp().isBefore(hourEnd))
                    .map(Donation::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String timeLabel = hourStart.format(DateTimeFormatter.ofPattern("HH:00"));
            result.add(new ChartDataPointDto(timeLabel, sum.doubleValue()));
        }

        return result;
    }

    /**
     * Агрегация по дням
     */
    private List<ChartDataPointDto> aggregateByDays(List<Donation> donations, int days) {
        LocalDateTime now = LocalDateTime.now();
        List<ChartDataPointDto> result = new ArrayList<>();

        for (int i = days - 1; i >= 0; i--) {
            LocalDateTime dayStart = now.minusDays(i).truncatedTo(ChronoUnit.DAYS);
            LocalDateTime dayEnd = dayStart.plusDays(1);

            BigDecimal sum = donations.stream()
                    .filter(d -> !d.getTimestamp().isBefore(dayStart) && d.getTimestamp().isBefore(dayEnd))
                    .map(Donation::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String timeLabel = dayStart.format(DateTimeFormatter.ofPattern("dd MMM"));
            result.add(new ChartDataPointDto(timeLabel, sum.doubleValue()));
        }

        return result;
    }

    /**
     * Агрегация по месяцам
     */
    private List<ChartDataPointDto> aggregateByMonths(List<Donation> donations, int months) {
        LocalDateTime now = LocalDateTime.now();
        List<ChartDataPointDto> result = new ArrayList<>();

        for (int i = months - 1; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
            LocalDateTime monthEnd = monthStart.plusMonths(1);

            BigDecimal sum = donations.stream()
                    .filter(d -> !d.getTimestamp().isBefore(monthStart) && d.getTimestamp().isBefore(monthEnd))
                    .map(Donation::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String timeLabel = monthStart.format(DateTimeFormatter.ofPattern("MMM"));
            result.add(new ChartDataPointDto(timeLabel, sum.doubleValue()));
        }

        return result;
    }

    /**
     * Получить начальную дату для периода
     */
    private LocalDateTime getStartDateFromPeriod(String period) {
        LocalDateTime now = LocalDateTime.now();
        switch (period) {
            case "24h":
                return now.minusHours(24);
            case "7d":
                return now.minusDays(7);
            case "month":
                return now.minusMonths(1);
            case "year":
                return now.minusYears(1);
            default:
                return now.minusMonths(1);
        }
    }

    /**
     * Маппинг Donation -> DonationDto
     */
    private DonationDto mapToDto(Donation donation) {
        return new DonationDto(
                donation.getId(),
                donation.getAmount().doubleValue(),
                donation.getSenderName(),
                donation.getMessage(),
                donation.getTimestamp(),
                donation.getStatus().name(),
                donation.getVoiceEnabled()
        );
    }
}




