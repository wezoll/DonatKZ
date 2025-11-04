package kz.donatkz.backend.repository;

import kz.donatkz.backend.model.Donation;
import kz.donatkz.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {

    /**
     * Найти все донаты пользователя после определенной даты с пагинацией
     */
    Page<Donation> findByUserAndTimestampAfter(User user, LocalDateTime timestamp, Pageable pageable);

    /**
     * Найти все донаты пользователя после определенной даты
     */
    List<Donation> findByUserAndTimestampAfter(User user, LocalDateTime timestamp);

    /**
     * Найти все донаты пользователя
     */
    List<Donation> findByUserOrderByTimestampDesc(User user);

    /**
     * Найти все донаты пользователя (без сортировки)
     */
    List<Donation> findByUser(User user);

    /**
     * Найти донаты по userId с пагинацией
     */
    Page<Donation> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Найти последние 10 донатов по userId
     */
    List<Donation> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Найти крупнейшие донаты по userId (за всё время)
     */
    Page<Donation> findByUserIdOrderByAmountDesc(Long userId, Pageable pageable);

    /**
     * Найти крупнейшие донаты по userId за период
     */
    Page<Donation> findByUserIdAndCreatedAtBetweenOrderByAmountDesc(
            Long userId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * Количество донатов пользователя
     */
    Long countByUserId(Long userId);

    /**
     * Сумма всех донатов пользователя по userId
     */
    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.userId = :userId")
    BigDecimal getTotalAmountByUserId(@Param("userId") Long userId);

    /**
     * Сумма всех донатов пользователя по User объекту
     */
    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.user = :user")
    java.util.Optional<BigDecimal> sumDonationsByUser(@Param("user") User user);

    /**
     * Средняя сумма доната
     */
    @Query("SELECT COALESCE(AVG(d.amount), 0) FROM Donation d WHERE d.userId = :userId")
    BigDecimal getAverageAmountByUserId(@Param("userId") Long userId);

    /**
     * Максимальная сумма доната
     */
    @Query("SELECT COALESCE(MAX(d.amount), 0) FROM Donation d WHERE d.userId = :userId")
    BigDecimal getMaxAmountByUserId(@Param("userId") Long userId);

    /**
     * Донаты за период
     */
    List<Donation> findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long userId,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    /**
     * Топ донатеров за период
     */
    @Query("SELECT d.senderName, SUM(d.amount), COUNT(d) " +
            "FROM Donation d " +
            "WHERE d.userId = :userId AND d.createdAt BETWEEN :startDate AND :endDate " +
            "GROUP BY d.senderName " +
            "ORDER BY SUM(d.amount) DESC")
    List<Object[]> getTopDonorsByUserIdAndPeriod(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * Топ донатеров за все время
     */
    @Query("SELECT d.senderName, SUM(d.amount), COUNT(d) " +
            "FROM Donation d " +
            "WHERE d.userId = :userId " +
            "GROUP BY d.senderName " +
            "ORDER BY SUM(d.amount) DESC")
    List<Object[]> getTopDonorsByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * Найти донат по hash (для дедупликации)
     */
    Donation findByDeduplicationHash(String hash);

    /**
     * Проверить существование доната по hash
     */
    boolean existsByDeduplicationHash(String hash);
}