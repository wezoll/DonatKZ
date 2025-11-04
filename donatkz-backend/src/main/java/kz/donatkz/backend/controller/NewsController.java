package kz.donatkz.backend.controller;

import jakarta.validation.Valid;
import kz.donatkz.backend.dto.NewsRequest;
import kz.donatkz.backend.dto.NewsResponse;
import kz.donatkz.backend.service.NewsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Контроллер для управления новостями
 */
@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@Slf4j
public class NewsController {

    private final NewsService newsService;

    /**
     * Получить все новости (публичный доступ)
     */
    @GetMapping
    public ResponseEntity<List<NewsResponse>> getAllNews() {
        List<NewsResponse> news = newsService.getAllNews();
        return ResponseEntity.ok(news);
    }

    /**
     * Получить новость по ID (публичный доступ)
     */
    @GetMapping("/{id}")
    public ResponseEntity<NewsResponse> getNewsById(@PathVariable Long id) {
        NewsResponse news = newsService.getNewsById(id);
        return ResponseEntity.ok(news);
    }

    /**
     * Создать новость (только для админов)
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<NewsResponse> createNews(@Valid @RequestBody NewsRequest request) {
        NewsResponse created = newsService.createNews(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Обновить новость (только для админов)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<NewsResponse> updateNews(
            @PathVariable Long id,
            @Valid @RequestBody NewsRequest request
    ) {
        NewsResponse updated = newsService.updateNews(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Удалить новость (только для админов)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> deleteNews(@PathVariable Long id) {
        newsService.deleteNews(id);
        return ResponseEntity.ok(Map.of("message", "Новость успешно удалена"));
    }
}

