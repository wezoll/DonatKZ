package kz.donatkz.backend.repository;

import kz.donatkz.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Репозиторий для работы с пользователями
 *
 * ВАЖНО: Добавь этот метод в существующий UserRepository!
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Существующие методы (должны уже быть):
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByVerificationToken(String token);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    // ========== НОВЫЙ МЕТОД ==========

    /**
     * Найти пользователя по WebSocket API Key
     * Используется для подключения к WebSocket каналу донатов
     */
    Optional<User> findByWebsocketApiKey(String websocketApiKey);

    Optional<User> findByResetPasswordToken(String token);
}
