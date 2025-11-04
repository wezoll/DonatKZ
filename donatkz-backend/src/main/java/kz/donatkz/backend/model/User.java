package kz.donatkz.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "channel_url")
    private String channelUrl;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "kaspi_phone")
    private String kaspiPhone;

    @Column(name = "is_active")
    private Boolean isActive = false;

    @Column(name = "is_email_verified")
    private Boolean isEmailVerified = false;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "verification_token_expires_at")
    private LocalDateTime verificationTokenExpiresAt;

    // ========== SUBSCRIPTION FIELDS ==========

    @Column(name = "subscription_tier")
    private String subscriptionTier = "FREE"; // FREE, BASIC, PREMIUM

    @Column(name = "subscription_expires_at")
    private LocalDateTime subscriptionExpiresAt; // Когда истекает подписка (NULL для FREE)

    @Column(name = "is_subscription_active")
    private Boolean isSubscriptionActive = true; // Активна ли подписка

    @Column(name = "monthly_donation_limit")
    private Integer monthlyDonationLimit = 100; // Лимит донатов в месяц (для FREE = 100, для BASIC/PREMIUM = NULL/unlimited)

    @Column(name = "current_month_donations")
    private Integer currentMonthDonations = 0; // Счетчик донатов в текущем месяце

    // ========== VOICE SETTINGS ==========

    @Column(name = "voice_enabled")
    private Boolean voiceEnabled = false; // Озвучка включена/выключена (доступно для BASIC/PREMIUM)

    @Column(name = "voice_min_amount", precision = 10, scale = 2)
    private java.math.BigDecimal voiceMinAmount = new java.math.BigDecimal("500"); // Мин. сумма для озвучки (500₸)

    @Column(name = "voice_language", length = 10)
    private String voiceLanguage = "ru-RU"; // Язык озвучки (ru-RU, kk-KZ, en-US)

    @Column(name = "voice_type", length = 20)
    private String voiceType = "robot"; // Тип голоса: robot, female, male

    @Column(name = "voice_volume")
    private Integer voiceVolume = 80; // Громкость озвучки (0-100)

    // ========== MODERATION SETTINGS ==========

    @Column(name = "moderation_enabled")
    private Boolean moderationEnabled = false; // Автоматическая фильтрация сообщений

    @Column(name = "banned_words", columnDefinition = "TEXT")
    private String bannedWords = "[]"; // JSON массив запрещенных слов

    // ========== WEBSOCKET API KEY ==========

    @Column(name = "websocket_api_key", unique = true, nullable = false, length = 64)
    private String websocketApiKey; // Уникальный API Key для WebSocket подключений (SHA-256 hash)

    // ========== USER ROLE ==========

    @Column(name = "role", length = 20)
    private String role = "USER"; // USER, ADMIN, SUPERADMIN

    // ========================================

    @PrePersist
    protected void onCreate() {
        if (this.websocketApiKey == null || this.websocketApiKey.isEmpty()) {
            this.websocketApiKey = generateWebSocketApiKey();
        }
    }

    private String generateWebSocketApiKey() {
        try {
            String data = this.email + System.currentTimeMillis() + Math.random();
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(hash)
                    .substring(0, 32)
                    .toLowerCase();
        } catch (Exception e) {
            return java.util.UUID.randomUUID().toString().replace("-", "");
        }
    }

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}