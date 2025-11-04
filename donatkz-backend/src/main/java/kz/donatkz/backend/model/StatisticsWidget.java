package kz.donatkz.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Виджет статистики для отображения донатов
 */
@Entity
@Table(name = "statistics_widgets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatisticsWidget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    // === Settings ===
    @Column(name = "header_text", length = 255)
    private String headerText;

    @Column(name = "display_type", nullable = false, length = 20)
    @Builder.Default
    private String displayType = "list"; // list, slider, ticker

    @Column(name = "data_type", nullable = false, length = 20)
    @Builder.Default
    private String dataType = "recent"; // recent, largest, most

    @Column(name = "period", nullable = false, length = 20)
    @Builder.Default
    private String period = "all-time"; // current-stream, last-stream, all-time, today, week, month, year

    @Column(name = "elements_count", nullable = false)
    @Builder.Default
    private Integer elementsCount = 5;

    @Column(name = "widget_speed")
    @Builder.Default
    private Integer widgetSpeed = 80;

    @Column(name = "template", nullable = false, length = 500)
    @Builder.Default
    private String template = "{username} - {amount}";

    @Column(name = "second_template", length = 500)
    private String secondTemplate;

    // === Design ===
    @Column(name = "position", nullable = false, length = 20)
    @Builder.Default
    private String position = "center"; // top, center, bottom

    // Text styles (JSON strings)
    @Column(name = "main_text_style", length = 1000)
    @Builder.Default
    private String mainTextStyle = "{\"fontFamily\":\"Montserrat\",\"fontSize\":18,\"textColor\":\"#FFFFFF\",\"isBold\":false,\"isItalic\":false,\"isUnderline\":false,\"transform\":\"none\",\"alignment\":\"center\"}";

    @Column(name = "secondary_text_style", length = 1000)
    @Builder.Default
    private String secondaryTextStyle = "{\"fontFamily\":\"Montserrat\",\"fontSize\":14,\"textColor\":\"#CCCCCC\",\"isBold\":false,\"isItalic\":false,\"isUnderline\":false,\"transform\":\"none\",\"alignment\":\"center\"}";

    // Background styles (JSON strings)
    @Column(name = "header_background", length = 500)
    @Builder.Default
    private String headerBackground = "{\"enabled\":false,\"color\":\"#1C1C1C\",\"opacity\":90}";

    @Column(name = "item_background", length = 500)
    @Builder.Default
    private String itemBackground = "{\"enabled\":true,\"color\":\"#1C1C1C\",\"opacity\":90}";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}


