package kz.donatkz.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsDto {
    private Long id;
    private String type; // update, announcement, feature
    private String title;
    private String description;
    private String fullDescription;
    private String badge;
    private String icon; // star, megaphone, news
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

