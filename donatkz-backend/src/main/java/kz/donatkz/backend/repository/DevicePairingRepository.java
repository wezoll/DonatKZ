package kz.donatkz.backend.repository;

import kz.donatkz.backend.model.DevicePairing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DevicePairingRepository extends JpaRepository<DevicePairing, Long> {

    // ========== ПОИСК ПО КОДУ ==========

    /**
     * Найти запись по коду привязки
     */
    Optional<DevicePairing> findByPairingCode(String pairingCode);

    /**
     * Проверить существование кода
     */
    boolean existsByPairingCode(String pairingCode);

    // ========== ПОИСК ПО ТОКЕНУ ==========

    /**
     * Найти устройство по device token
     */
    Optional<DevicePairing> findByDeviceToken(String deviceToken);

    /**
     * Найти устройство по device ID (UUID)
     */
    Optional<DevicePairing> findByDeviceId(String deviceId);

    // ========== УПРАВЛЕНИЕ УСТРОЙСТВАМИ ==========

    /**
     * Получить все активные устройства пользователя
     */
    List<DevicePairing> findByUserIdAndIsActiveTrue(Long userId);

    /**
     * Получить все устройства пользователя (активные и неактивные)
     */
    List<DevicePairing> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Подсчитать количество активных устройств пользователя
     */
    @Query("SELECT COUNT(dp) FROM DevicePairing dp WHERE dp.userId = :userId AND dp.isActive = true")
    Integer countActiveDevicesByUserId(@Param("userId") Long userId);

    // ========== ОЧИСТКА ИСТЕКШИХ КОДОВ ==========

    /**
     * Найти все истекшие неактивированные коды (для очистки)
     */
    @Query("SELECT dp FROM DevicePairing dp WHERE dp.isActive = false AND dp.expiresAt < :now")
    List<DevicePairing> findExpiredInactivePairings(@Param("now") LocalDateTime now);

    /**
     * Удалить все истекшие неактивированные коды
     */
    void deleteByIsActiveFalseAndExpiresAtBefore(LocalDateTime expiresAt);

    // ========== ВАЛИДАЦИЯ ==========

    /**
     * Найти действительный (не истекший и не активированный) код
     */
    @Query("SELECT dp FROM DevicePairing dp " +
            "WHERE dp.pairingCode = :code " +
            "AND dp.isActive = false " +
            "AND dp.expiresAt > :now")
    Optional<DevicePairing> findValidPairingCode(
            @Param("code") String code,
            @Param("now") LocalDateTime now
    );
}