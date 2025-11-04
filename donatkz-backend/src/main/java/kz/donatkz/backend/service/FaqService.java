package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.FaqRequest;
import kz.donatkz.backend.dto.FaqResponse;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.Faq;
import kz.donatkz.backend.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaqService {

    private final FaqRepository faqRepository;

    /**
     * Получить все FAQ
     */
    public List<FaqResponse> getAllFaq() {
        return faqRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Получить FAQ по ID
     */
    public FaqResponse getFaqById(Long id) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ не найден"));
        return mapToResponse(faq);
    }

    /**
     * Создать FAQ
     */
    @Transactional
    public FaqResponse createFaq(FaqRequest request) {
        Faq faq = Faq.builder()
                .question(request.getQuestion())
                .answer(request.getAnswer())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        faq = faqRepository.save(faq);
        log.info("FAQ created: id={}, question={}", faq.getId(), faq.getQuestion());
        
        return mapToResponse(faq);
    }

    /**
     * Обновить FAQ
     */
    @Transactional
    public FaqResponse updateFaq(Long id, FaqRequest request) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ не найден"));

        faq.setQuestion(request.getQuestion());
        faq.setAnswer(request.getAnswer());
        if (request.getDisplayOrder() != null) {
            faq.setDisplayOrder(request.getDisplayOrder());
        }

        faq = faqRepository.save(faq);
        log.info("FAQ updated: id={}, question={}", faq.getId(), faq.getQuestion());
        
        return mapToResponse(faq);
    }

    /**
     * Удалить FAQ
     */
    @Transactional
    public void deleteFaq(Long id) {
        if (!faqRepository.existsById(id)) {
            throw new ResourceNotFoundException("FAQ не найден");
        }
        faqRepository.deleteById(id);
        log.info("FAQ deleted: id={}", id);
    }

    /**
     * Маппинг в DTO
     */
    private FaqResponse mapToResponse(Faq faq) {
        return FaqResponse.builder()
                .id(faq.getId())
                .question(faq.getQuestion())
                .answer(faq.getAnswer())
                .displayOrder(faq.getDisplayOrder())
                .createdAt(faq.getCreatedAt())
                .updatedAt(faq.getUpdatedAt())
                .build();
    }
}

