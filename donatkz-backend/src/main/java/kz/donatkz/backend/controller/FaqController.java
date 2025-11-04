package kz.donatkz.backend.controller;

import jakarta.validation.Valid;
import kz.donatkz.backend.dto.FaqRequest;
import kz.donatkz.backend.dto.FaqResponse;
import kz.donatkz.backend.service.FaqService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Контроллер для управления FAQ
 */
@RestController
@RequestMapping("/api/faq")
@RequiredArgsConstructor
@Slf4j
public class FaqController {

    private final FaqService faqService;

    /**
     * Получить все FAQ (публичный доступ)
     */
    @GetMapping
    public ResponseEntity<List<FaqResponse>> getAllFaq() {
        List<FaqResponse> faq = faqService.getAllFaq();
        return ResponseEntity.ok(faq);
    }

    /**
     * Получить FAQ по ID (публичный доступ)
     */
    @GetMapping("/{id}")
    public ResponseEntity<FaqResponse> getFaqById(@PathVariable Long id) {
        FaqResponse faq = faqService.getFaqById(id);
        return ResponseEntity.ok(faq);
    }

    /**
     * Создать FAQ (только для админов)
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<FaqResponse> createFaq(@Valid @RequestBody FaqRequest request) {
        FaqResponse created = faqService.createFaq(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Обновить FAQ (только для админов)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<FaqResponse> updateFaq(
            @PathVariable Long id,
            @Valid @RequestBody FaqRequest request
    ) {
        FaqResponse updated = faqService.updateFaq(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Удалить FAQ (только для админов)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> deleteFaq(@PathVariable Long id) {
        faqService.deleteFaq(id);
        return ResponseEntity.ok(Map.of("message", "FAQ успешно удален"));
    }
}

