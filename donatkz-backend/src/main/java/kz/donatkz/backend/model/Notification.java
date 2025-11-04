package kz.donatkz.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    // ========== ОСНОВНЫЕ НАСТРОЙКИ ==========

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "min_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal minAmount = BigDecimal.ZERO;

    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;

    @Column(name = "widget_url", nullable = false, unique = true, length = 500)
    private String widgetUrl;

    // ========== ИЗОБРАЖЕНИЕ/GIF ==========

    @Column(name = "gif_url", columnDefinition = "TEXT")
    private String gifUrl;

    @Column(name = "gif_type", length = 20)
    private String gifType = "preset"; // preset или custom

    // ========== ЗВУК ==========

    @Column(name = "sound_url", columnDefinition = "TEXT")
    private String soundUrl;

    @Column(name = "sound_type", length = 20)
    private String soundType = "preset"; // preset или custom

    // ========== НАСТРОЙКИ ОТОБРАЖЕНИЯ ==========

    @Column(name = "display_duration")
    private Integer displayDuration = 7; // секунды

    @Column(name = "volume")
    private Integer volume = 100; // 0-100

    @Column(name = "enter_animation", length = 20)
    private String enterAnimation = "left"; // left, right, top, bottom

    @Column(name = "exit_animation", length = 20)
    private String exitAnimation = "left";

    // ========== ШАБЛОНЫ ТЕКСТА ==========

    @Column(name = "title_template", length = 500)
    private String titleTemplate = "{username} - {amount}!";

    @Column(name = "message_template", length = 500)
    private String messageTemplate = "{message}";

    // ========== СТИЛИ ЗАГОЛОВКА ==========

    @Column(name = "title_font_family", length = 100)
    private String titleFontFamily = "Montserrat";

    @Column(name = "title_font_size")
    private Integer titleFontSize = 32;

    @Column(name = "title_text_color", length = 20)
    private String titleTextColor = "#FFD700";

    @Column(name = "title_is_bold")
    private Boolean titleIsBold = true;

    @Column(name = "title_is_italic")
    private Boolean titleIsItalic = false;

    @Column(name = "title_is_underline")
    private Boolean titleIsUnderline = false;

    @Column(name = "title_transform", length = 20)
    private String titleTransform = "none"; // none, uppercase, lowercase

    @Column(name = "title_alignment", length = 20)
    private String titleAlignment = "center"; // left, center, right

    // ========== СТИЛИ СООБЩЕНИЯ ==========

    @Column(name = "message_font_family", length = 100)
    private String messageFontFamily = "Montserrat";

    @Column(name = "message_font_size")
    private Integer messageFontSize = 20;

    @Column(name = "message_text_color", length = 20)
    private String messageTextColor = "#FFFFFF";

    @Column(name = "message_is_bold")
    private Boolean messageIsBold = false;

    @Column(name = "message_is_italic")
    private Boolean messageIsItalic = false;

    @Column(name = "message_is_underline")
    private Boolean messageIsUnderline = false;

    @Column(name = "message_transform", length = 20)
    private String messageTransform = "none";

    @Column(name = "message_alignment", length = 20)
    private String messageAlignment = "center";

    // ========== ТЕХНИЧЕСКИЕ ПОЛЯ ==========

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}