package kz.donatkz.backend.repository;

import kz.donatkz.backend.model.StatisticsWidget;
import kz.donatkz.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StatisticsWidgetRepository extends JpaRepository<StatisticsWidget, Long> {
    
    /**
     * Найти все виджеты пользователя
     */
    List<StatisticsWidget> findByUserOrderByCreatedAtDesc(User user);
    
    /**
     * Найти виджет по ID и пользователю
     */
    Optional<StatisticsWidget> findByIdAndUser(Long id, User user);
}


