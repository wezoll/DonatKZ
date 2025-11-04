package kz.donatkz.backend.repository;

import kz.donatkz.backend.model.Notification;
import kz.donatkz.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Найти все уведомления пользователя
     */
    List<Notification> findByUserIdOrderByMinAmountAsc(Long userId);

    /**
     * Найти уведомление по ID и userId (для безопасности)
     */
    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    /**
     * Найти включенные уведомления пользователя, отсортированные по убыванию суммы
     * Используется для выбора подходящего уведомления по сумме доната
     */
    List<Notification> findByUserAndIsEnabledOrderByMinAmountDesc(User user, Boolean isEnabled);

    /**
     * Найти активные уведомления пользователя для суммы
     */
    List<Notification> findByUserIdAndIsEnabledTrueAndMinAmountLessThanEqualOrderByMinAmountDesc(
            Long userId,
            BigDecimal amount
    );

    /**
     * Проверить существование уведомления с таким URL
     */
    boolean existsByWidgetUrl(String widgetUrl);

    /**
     * Найти уведомление по widget URL
     */
    Optional<Notification> findByWidgetUrl(String widgetUrl);

    /**
     * Удалить все уведомления пользователя
     */
    void deleteAllByUserId(Long userId);

    /**
     * Количество уведомлений пользователя
     */
    long countByUserId(Long userId);
}