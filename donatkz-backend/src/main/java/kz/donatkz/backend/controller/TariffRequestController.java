package kz.donatkz.backend.controller;

import jakarta.validation.Valid;
import kz.donatkz.backend.dto.TariffRequestCreateRequest;
import kz.donatkz.backend.dto.TariffRequestResponse;
import kz.donatkz.backend.dto.admin.TariffRequestUpdateRequest;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.service.TariffRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tariff-requests")
@RequiredArgsConstructor
@Slf4j
public class TariffRequestController {

    private final TariffRequestService tariffRequestService;
    private final UserRepository userRepository;

    /**
     * POST /api/tariff-requests
     * Создать заявку на оплату тарифа
     */
    @PostMapping
    public ResponseEntity<TariffRequestResponse> createTariffRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TariffRequestCreateRequest request
    ) {
        Long userId = getUserId(userDetails);
        log.info("User {} creating tariff request: tariff={}, duration={}", userId, request.getTariff(), request.getDurationMonths());
        
        TariffRequestResponse response = tariffRequestService.createTariffRequest(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/tariff-requests/my
     * Получить заявки текущего пользователя
     */
    @GetMapping("/my")
    public ResponseEntity<List<TariffRequestResponse>> getMyTariffRequests(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = getUserId(userDetails);
        log.info("User {} fetching their tariff requests", userId);
        
        List<TariffRequestResponse> requests = tariffRequestService.getUserTariffRequests(userId);
        return ResponseEntity.ok(requests);
    }

    /**
     * GET /api/tariff-requests
     * Получить все заявки (только для админов)
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<TariffRequestResponse>> getAllTariffRequests() {
        log.info("Admin fetching all tariff requests");
        
        List<TariffRequestResponse> requests = tariffRequestService.getAllTariffRequests();
        return ResponseEntity.ok(requests);
    }

    /**
     * PUT /api/tariff-requests/{id}/status
     * Обновить статус заявки (только для админов)
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<TariffRequestResponse> updateTariffRequestStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TariffRequestUpdateRequest request
    ) {
        Long adminId = getUserId(userDetails);
        log.info("Admin {} updating tariff request {} status to {}", adminId, id, request.getStatus());
        
        TariffRequestResponse response = tariffRequestService.updateTariffRequestStatus(id, request, adminId);
        return ResponseEntity.ok(response);
    }

    private Long getUserId(UserDetails userDetails) {
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        return user.getId();
    }
}

