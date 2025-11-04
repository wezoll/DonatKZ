package kz.donatkz.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "device_pairing")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevicePairing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(name = "pairing_code", unique = true, nullable = false, length = 6)
    private String pairingCode; // 6-значный код (например: "A7K9M2")

    @Column(name = "device_token", columnDefinition = "TEXT")
    private String deviceToken; // Долгосрочный JWT токен для Desktop App (заполняется после успешной привязки)

    @Column(name = "device_name", length = 100)
    private String deviceName; // Название устройства ("My PC", "Work Laptop")

    @Column(name = "device_id", unique = true, nullable = false, length = 100)
    private String deviceId; // Уникальный ID устройства (UUID, например: F9DF1355-F25E-5871-B8SA-B586E86CV5B4)

    @Column(name = "is_active")
    private Boolean isActive = false; // Активно ли устройство (true после успешной привязки)

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt; // Когда истекает код (5 минут с момента создания)

    @Column(name = "paired_at")
    private LocalDateTime pairedAt; // Когда устройство было успешно привязано

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt; // Когда последний раз использовался device_token

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; // Когда был создан код

    // Метод для проверки истечения кода
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    // Метод для проверки, можно ли использовать код
    public boolean isUsable() {
        return !isActive && !isExpired();
    }
}