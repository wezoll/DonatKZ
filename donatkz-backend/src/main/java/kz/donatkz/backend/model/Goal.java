package kz.donatkz.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Цель сбора (Goal)
 * Стример может создать цель сбора с описанием и целевой суммой
 */
@Entity
@Table(name = "goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "target_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal targetAmount;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Дизайн настройки
    @Builder.Default
    @Column(name = "height", nullable = false)
    private Double height = 2.5;

    @Builder.Default
    @Column(name = "border_radius", nullable = false)
    private Double borderRadius = 1.0;

    @Builder.Default
    @Column(name = "stroke_width", nullable = false)
    private Double strokeWidth = 0.0;

    @Builder.Default
    @Column(name = "stroke_color", length = 20)
    private String strokeColor = "#88b702";

    @Builder.Default
    @Column(name = "background_color", length = 20)
    private String backgroundColor = "#424242";

    @Builder.Default
    @Column(name = "use_gradient", nullable = false)
    private Boolean useGradient = false;

    @Builder.Default
    @Column(name = "gradient_fill_color1", length = 20)
    private String gradientFillColor1 = "#88b702";

    @Builder.Default
    @Column(name = "gradient_fill_color2", length = 20)
    private String gradientFillColor2 = "#ccf855ff";

    @Builder.Default
    @Column(name = "gradient_angle", nullable = false)
    private Integer gradientAngle = 0;

    @Builder.Default
    @Column(name = "use_color", nullable = false)
    private Boolean useColor = true;

    @Builder.Default
    @Column(name = "show_background", nullable = false)
    private Boolean showBackground = false;

    @Builder.Default
    @Column(name = "title_position", length = 20)
    private String titlePosition = "top";

    @Builder.Default
    @Column(name = "progress_position", length = 20)
    private String progressPosition = "inside";

    @Builder.Default
    @Column(name = "progress_display", length = 50)
    private String progressDisplay = "amount-percent";

    // Стили текста (JSON строки)
    @Builder.Default
    @Column(name = "title_text_style", length = 1000)
    private String titleTextStyle = "{\"fontFamily\":\"Montserrat\",\"fontSize\":18,\"textColor\":\"#FFFFFF\",\"isBold\":false,\"isItalic\":false,\"isUnderline\":false,\"transform\":\"none\",\"alignment\":\"center\"}";

    @Builder.Default
    @Column(name = "progress_text_style", length = 1000)
    private String progressTextStyle = "{\"fontFamily\":\"Montserrat\",\"fontSize\":16,\"textColor\":\"#FFFFFF\",\"isBold\":false,\"isItalic\":false,\"isUnderline\":false,\"transform\":\"none\",\"alignment\":\"center\"}";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

