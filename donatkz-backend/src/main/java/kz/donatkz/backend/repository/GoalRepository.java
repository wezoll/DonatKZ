package kz.donatkz.backend.repository;

import kz.donatkz.backend.model.Goal;
import kz.donatkz.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {
    
    /**
     * Найти все цели пользователя
     */
    List<Goal> findByUserOrderByCreatedAtDesc(User user);
    
    /**
     * Найти активные цели пользователя
     */
    List<Goal> findByUserAndIsActiveTrueOrderByCreatedAtDesc(User user);
    
    /**
     * Найти цель по ID и пользователю
     */
    Optional<Goal> findByIdAndUser(Long id, User user);
    
    /**
     * Найти активную цель пользователя (первую)
     */
    Optional<Goal> findFirstByUserAndIsActiveTrueOrderByCreatedAtDesc(User user);
}


