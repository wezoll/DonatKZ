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
@Table(name = "donations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "sender_name", nullable = false, length = 100)
    private String senderName;

    @Column(length = 500)
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp; // Время из Kaspi уведомления

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DonationStatus status = DonationStatus.PENDING;

    @Column(name = "is_processed")
    private Boolean isProcessed = false;

    @Column(name = "deduplication_hash", unique = true, nullable = false)
    private String deduplicationHash; // SHA-256 хэш для предотвращения дубликатов

    @Column(name = "raw_notification_text", columnDefinition = "TEXT")
    private String rawNotificationText; // Оригинальный текст уведомления из Kaspi

    @Column(name = "applied_customization_id")
    private Long appliedCustomizationId; // ID кастомизации виджета (пока nullable)

    @Column(name = "voice_enabled")
    private Boolean voiceEnabled = false; // Озвучка включена/выключена

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enum для статусов
    public enum DonationStatus {
        PENDING,    // Ожидает обработки
        PROCESSED,  // Успешно обработан
        FAILED,     // Ошибка обработки
        DUPLICATE   // Дубликат (отклонен)
    }
}