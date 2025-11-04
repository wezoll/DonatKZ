package kz.donatkz.backend.controller;

import jakarta.validation.Valid;
import kz.donatkz.backend.dto.*;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.service.DonationService;
import kz.donatkz.backend.service.DonationChartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API для управления донатами
 * Поддерживает:
 * 1. Dashboard (графики, статистика) - DonationChartService
 * 2. Desktop App (создание донатов) - DonationService
 */
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
@Slf4j
public class DonationController {

    private final DonationService donationService;
    private final DonationChartService donationChartService;
    private final UserRepository userRepository;

    // ========== DESKTOP APP ENDPOINTS ==========

    /**
     * POST /api/donations
     * Создание нового доната (вызывается из Desktop App)
     */
    @PostMapping
    public ResponseEntity<DonationResponse> createDonation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DonationRequest request
    ) {
        log.info("Creating donation for user: {}, amount: {}", userDetails.getUsername(), request.getAmount());

        DonationResponse response = donationService.createDonation(getUserId(userDetails), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /**
     * GET /api/donations/recent
     * Получить последние N донатов
     */
    @GetMapping("/recent")
    public ResponseEntity<List<DonationResponse>> getRecentDonations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "10") int limit
    ) {
        log.info("Getting recent {} donations for user: {}", limit, userDetails.getUsername());

        List<DonationResponse> donations = donationService.getRecentDonations(getUserId(userDetails), limit);

        return ResponseEntity.ok(donations);
    }

    /**
     * GET /api/donations/top/{period}
     * Получить топ донатеров за период
     * period: TODAY, WEEK, MONTH, ALL_TIME
     */
    @GetMapping("/top/{period}")
    public ResponseEntity<List<TopDonorDto>> getTopDonors(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String period,
            @RequestParam(defaultValue = "10") int limit
    ) {
        log.info("Getting top {} donors for user: {}, period: {}", limit, userDetails.getUsername(), period);

        List<TopDonorDto> topDonors = donationService.getTopDonors(getUserId(userDetails), period, limit);

        return ResponseEntity.ok(topDonors);
    }

    // ========== DASHBOARD ENDPOINTS ==========

    /**
     * GET /api/donations
     * Получить список донатов с пагинацией (для Dashboard)
     *
     * @param period Период: 24h, 7d, month, year
     * @param page Номер страницы (default: 0)
     * @param size Размер страницы (default: 20)
     * @return Страница с донатами
     */
    @GetMapping
    public ResponseEntity<Page<DonationDto>> getDonations(
            Authentication authentication,
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = getUserFromAuthentication(authentication);
        Page<DonationDto> donations = donationChartService.getDonations(user, period, page, size);
        return ResponseEntity.ok(donations);
    }

    /**
     * GET /api/donations/stats
     * Получить статистику донатов за период (для Dashboard)
     *
     * @param period Период: 24h, 7d, month, year
     * @return Статистика (количество, сумма, средний чек, макс донат)
     */
    @GetMapping("/stats")
    public ResponseEntity<DonationStatsDashboardDto> getStatistics(
            Authentication authentication,
            @RequestParam(defaultValue = "24h") String period
    ) {
        User user = getUserFromAuthentication(authentication);
        DonationStatsDashboardDto stats = donationChartService.getStatistics(user, period);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/donations/chart
     * Получить данные для графика (для Dashboard)
     *
     * @param period Период: 24h, 7d, month, year
     * @return Список точек для графика (время + сумма)
     */
    @GetMapping("/chart")
    public ResponseEntity<List<ChartDataPointDto>> getChartData(
            Authentication authentication,
            @RequestParam(defaultValue = "month") String period
    ) {
        User user = getUserFromAuthentication(authentication);
        log.info("Getting chart data for user: {}, period: {}", user.getUsername(), period);

        List<ChartDataPointDto> chartData = donationChartService.getChartData(user, period);

        log.info("Returning {} chart data points", chartData.size());
        return ResponseEntity.ok(chartData);
    }

    // ========== HELPER METHODS ==========

    /**
     * Получить User из Authentication (для Dashboard)
     */
    private User getUserFromAuthentication(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
    }

    /**
     * Получить userId из UserDetails (для Desktop App)
     */
    private Long getUserId(UserDetails userDetails) {
        String username = userDetails.getUsername();

        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        return user.getId();
    }
}