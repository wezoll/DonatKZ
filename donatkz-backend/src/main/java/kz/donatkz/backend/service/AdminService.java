package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.admin.*;
import kz.donatkz.backend.exception.BadRequestException;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.Faq;
import kz.donatkz.backend.model.News;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.FaqRepository;
import kz.donatkz.backend.repository.NewsRepository;
import kz.donatkz.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final NewsRepository newsRepository;
    private final FaqRepository faqRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ========== USER MANAGEMENT ==========

    @Transactional(readOnly = true)
    public List<AdminUserDto> getAllUsers() {
        log.info("Fetching all users for admin panel");
        return userRepository.findAll().stream()
                .map(this::convertToAdminUserDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminUserDto updateUserRole(Long userId, String role) {
        log.info("Updating user {} role to {}", userId, role);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        user.setRole(role);
        user = userRepository.save(user);

        log.info("User {} role updated to {}", userId, role);
        return convertToAdminUserDto(user);
    }

    @Transactional
    public AdminUserDto updateUserTariff(Long userId, String tariff, String tariffStart, String tariffEnd) {
        log.info("Updating user {} tariff to {} ({} - {})", userId, tariff, tariffStart, tariffEnd);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        user.setSubscriptionTier(tariff);

        // Парсинг дат (сохраняем как LocalDateTime)
        try {
            LocalDateTime startDate = LocalDateTime.parse(tariffStart + "T00:00:00");
            LocalDateTime endDate = LocalDateTime.parse(tariffEnd + "T23:59:59");

            user.setSubscriptionStartAt(startDate);
            user.setSubscriptionExpiresAt(endDate);

        } catch (Exception e) {
            throw new BadRequestException("Неверный формат даты. Используйте yyyy-MM-dd");
        }

        user = userRepository.save(user);

        log.info("User {} tariff updated successfully", userId);
        return convertToAdminUserDto(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        log.info("Deleting user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        // Проверка, что не удаляем главного админа
        if ("SUPERADMIN".equals(user.getRole())) {
            throw new BadRequestException("Невозможно удалить главного администратора");
        }

        userRepository.delete(user);
        log.info("User {} deleted successfully", userId);
    }

    // ========== NEWS MANAGEMENT ==========

    @Transactional(readOnly = true)
    public List<NewsDto> getAllNews() {
        log.info("Fetching all news");
        return newsRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::convertToNewsDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public NewsDto createNews(NewsCreateRequest request) {
        log.info("Creating news: {}", request.getTitle());

        News news = News.builder()
                .type(request.getType())
                .title(request.getTitle())
                .description(request.getDescription())
                .fullDescription(request.getFullDescription())
                .badge(request.getBadge())
                .icon(request.getIcon())
                .build();

        news = newsRepository.save(news);

        log.info("News created with ID: {}", news.getId());
        return convertToNewsDto(news);
    }

    @Transactional
    public NewsDto updateNews(Long newsId, NewsCreateRequest request) {
        log.info("Updating news {}", newsId);

        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new ResourceNotFoundException("Новость не найдена"));

        news.setType(request.getType());
        news.setTitle(request.getTitle());
        news.setDescription(request.getDescription());
        news.setFullDescription(request.getFullDescription());
        news.setBadge(request.getBadge());
        news.setIcon(request.getIcon());

        news = newsRepository.save(news);

        log.info("News {} updated successfully", newsId);
        return convertToNewsDto(news);
    }

    @Transactional
    public void deleteNews(Long newsId) {
        log.info("Deleting news {}", newsId);

        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new ResourceNotFoundException("Новость не найдена"));

        newsRepository.delete(news);
        log.info("News {} deleted successfully", newsId);
    }

    // ========== FAQ MANAGEMENT ==========

    @Transactional(readOnly = true)
    public List<FaqDto> getAllFaq() {
        log.info("Fetching all FAQ");
        return faqRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::convertToFaqDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FaqDto createFaq(FaqCreateRequest request) {
        log.info("Creating FAQ: {}", request.getQuestion());

        Faq faq = Faq.builder()
                .question(request.getQuestion())
                .answer(request.getAnswer())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        faq = faqRepository.save(faq);

        log.info("FAQ created with ID: {}", faq.getId());
        return convertToFaqDto(faq);
    }

    @Transactional
    public FaqDto updateFaq(Long faqId, FaqCreateRequest request) {
        log.info("Updating FAQ {}", faqId);

        Faq faq = faqRepository.findById(faqId)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ не найден"));

        faq.setQuestion(request.getQuestion());
        faq.setAnswer(request.getAnswer());
        if (request.getDisplayOrder() != null) {
            faq.setDisplayOrder(request.getDisplayOrder());
        }

        faq = faqRepository.save(faq);

        log.info("FAQ {} updated successfully", faqId);
        return convertToFaqDto(faq);
    }

    @Transactional
    public void deleteFaq(Long faqId) {
        log.info("Deleting FAQ {}", faqId);

        Faq faq = faqRepository.findById(faqId)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ не найден"));

        faqRepository.delete(faq);
        log.info("FAQ {} deleted successfully", faqId);
    }

    // ========== CONVERTERS ==========

    private AdminUserDto convertToAdminUserDto(User user) {
        return AdminUserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole() : "USER")
                .tariff(user.getSubscriptionTier())
                .tariffStart(
                        user.getSubscriptionStartAt() != null ? user.getSubscriptionStartAt().toLocalDate().toString()
                                : (user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate().toString() : ""))
                .tariffEnd(user.getSubscriptionExpiresAt() != null
                        ? user.getSubscriptionExpiresAt().toLocalDate().toString()
                        : "")
                .createdAt(user.getCreatedAt())
                .build();
    }

    private NewsDto convertToNewsDto(News news) {
        return NewsDto.builder()
                .id(news.getId())
                .type(news.getType())
                .title(news.getTitle())
                .description(news.getDescription())
                .fullDescription(news.getFullDescription())
                .badge(news.getBadge())
                .icon(news.getIcon())
                .createdAt(news.getCreatedAt())
                .updatedAt(news.getUpdatedAt())
                .build();
    }

    private FaqDto convertToFaqDto(Faq faq) {
        return FaqDto.builder()
                .id(faq.getId())
                .question(faq.getQuestion())
                .answer(faq.getAnswer())
                .displayOrder(faq.getDisplayOrder())
                .createdAt(faq.getCreatedAt())
                .updatedAt(faq.getUpdatedAt())
                .build();
    }
}
