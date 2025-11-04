package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.NewsRequest;
import kz.donatkz.backend.dto.NewsResponse;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.News;
import kz.donatkz.backend.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsService {

    private final NewsRepository newsRepository;

    /**
     * Получить все новости
     */
    public List<NewsResponse> getAllNews() {
        return newsRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Получить новость по ID
     */
    public NewsResponse getNewsById(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Новость не найдена"));
        return mapToResponse(news);
    }

    /**
     * Создать новость
     */
    @Transactional
    public NewsResponse createNews(NewsRequest request) {
        News news = News.builder()
                .type(request.getType())
                .title(request.getTitle())
                .description(request.getDescription())
                .fullDescription(request.getFullDescription())
                .badge(request.getBadge())
                .icon(request.getIcon())
                .build();

        news = newsRepository.save(news);
        log.info("News created: id={}, title={}", news.getId(), news.getTitle());
        
        return mapToResponse(news);
    }

    /**
     * Обновить новость
     */
    @Transactional
    public NewsResponse updateNews(Long id, NewsRequest request) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Новость не найдена"));

        news.setType(request.getType());
        news.setTitle(request.getTitle());
        news.setDescription(request.getDescription());
        news.setFullDescription(request.getFullDescription());
        news.setBadge(request.getBadge());
        news.setIcon(request.getIcon());

        news = newsRepository.save(news);
        log.info("News updated: id={}, title={}", news.getId(), news.getTitle());
        
        return mapToResponse(news);
    }

    /**
     * Удалить новость
     */
    @Transactional
    public void deleteNews(Long id) {
        if (!newsRepository.existsById(id)) {
            throw new ResourceNotFoundException("Новость не найдена");
        }
        newsRepository.deleteById(id);
        log.info("News deleted: id={}", id);
    }

    /**
     * Маппинг в DTO
     */
    private NewsResponse mapToResponse(News news) {
        return NewsResponse.builder()
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
}

