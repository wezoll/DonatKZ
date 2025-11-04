package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsResponse {
    
    private Long id;
    private String type;
    private String title;
    private String description;
    private String fullDescription;
    private String badge;
    private String icon;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

