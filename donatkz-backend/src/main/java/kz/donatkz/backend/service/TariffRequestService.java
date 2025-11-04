package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.TariffRequestCreateRequest;
import kz.donatkz.backend.dto.TariffRequestResponse;
import kz.donatkz.backend.dto.admin.TariffRequestUpdateRequest;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.TariffRequest;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.TariffRequestRepository;
import kz.donatkz.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TariffRequestService {

    private final TariffRequestRepository tariffRequestRepository;
    private final UserRepository userRepository;

    /**
     * Создать заявку на оплату тарифа
     */
    @Transactional
    public TariffRequestResponse createTariffRequest(Long userId, TariffRequestCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        TariffRequest tariffRequest = TariffRequest.builder()
                .user(user)
                .tariff(request.getTariff())
                .durationMonths(request.getDurationMonths())
                .amount(request.getAmount())
                .promocode(request.getPromocode())
                .receiptUrl(request.getReceiptUrl())
                .status("pending")
                .build();

        tariffRequest = tariffRequestRepository.save(tariffRequest);
        log.info("Tariff request created: id={}, user={}, tariff={}, amount={}", 
                tariffRequest.getId(), user.getUsername(), request.getTariff(), request.getAmount());

        return mapToResponse(tariffRequest);
    }

    /**
     * Получить все заявки (для админов)
     */
    @Transactional(readOnly = true)
    public List<TariffRequestResponse> getAllTariffRequests() {
        return tariffRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Получить заявки пользователя
     */
    @Transactional(readOnly = true)
    public List<TariffRequestResponse> getUserTariffRequests(Long userId) {
        return tariffRequestRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Обновить статус заявки (для админов)
     */
    @Transactional
    public TariffRequestResponse updateTariffRequestStatus(Long requestId, TariffRequestUpdateRequest updateRequest, Long adminId) {
        TariffRequest tariffRequest = tariffRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Заявка не найдена"));

        User admin = null;
        if (adminId != null) {
            admin = userRepository.findById(adminId)
                    .orElse(null);
        }

        tariffRequest.setStatus(updateRequest.getStatus());
        tariffRequest.setAdminNotes(updateRequest.getAdminNotes());
        tariffRequest.setReviewedAt(LocalDateTime.now());
        tariffRequest.setReviewedBy(admin);

        tariffRequest = tariffRequestRepository.save(tariffRequest);
        log.info("Tariff request {} updated: status={}, admin={}", 
                requestId, updateRequest.getStatus(), admin != null ? admin.getUsername() : "system");

        return mapToResponse(tariffRequest);
    }

    /**
     * Маппинг в DTO
     */
    private TariffRequestResponse mapToResponse(TariffRequest tariffRequest) {
        return TariffRequestResponse.builder()
                .id(tariffRequest.getId())
                .userId(tariffRequest.getUser().getId())
                .username(tariffRequest.getUser().getUsername())
                .email(tariffRequest.getUser().getEmail())
                .tariff(tariffRequest.getTariff())
                .durationMonths(tariffRequest.getDurationMonths())
                .amount(tariffRequest.getAmount())
                .promocode(tariffRequest.getPromocode())
                .receiptUrl(tariffRequest.getReceiptUrl())
                .status(tariffRequest.getStatus())
                .adminNotes(tariffRequest.getAdminNotes())
                .createdAt(tariffRequest.getCreatedAt())
                .updatedAt(tariffRequest.getUpdatedAt())
                .reviewedAt(tariffRequest.getReviewedAt())
                .reviewedBy(tariffRequest.getReviewedBy() != null ? tariffRequest.getReviewedBy().getId() : null)
                .reviewedByUsername(tariffRequest.getReviewedBy() != null ? tariffRequest.getReviewedBy().getUsername() : null)
                .build();
    }
}

