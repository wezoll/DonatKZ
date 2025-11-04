package kz.donatkz.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Сервис для генерации и управления WebSocket API Keys
 *
 * API Key используется для безопасного подключения к WebSocket каналу донатов
 */
@Service
@Slf4j
public class WebSocketApiKeyService {

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Сгенерировать новый уникальный API Key
     *
     * Формат: base64url(sha256(random_bytes + timestamp))
     * Пример: "a7k9m2p5q8w3x6c4v7b1n9h5j2l8"
     *
     * @return уникальный API Key (32 символа)
     */
    public String generateApiKey() {
        try {
            // Генерируем 32 случайных байта
            byte[] randomBytes = new byte[32];
            secureRandom.nextBytes(randomBytes);

            // Добавляем timestamp для уникальности
            String data = Base64.getEncoder().encodeToString(randomBytes) + System.currentTimeMillis();

            // Хешируем SHA-256
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));

            // Конвертируем в URL-safe Base64 и берем первые 32 символа
            String apiKey = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(hash)
                    .substring(0, 32)
                    .toLowerCase();

            log.debug("Generated new API Key: {}...", apiKey.substring(0, 8));

            return apiKey;

        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate API Key: SHA-256 not available", e);
            throw new RuntimeException("Failed to generate API Key", e);
        }
    }

    /**
     * Проверить валидность формата API Key
     *
     * @param apiKey - ключ для проверки
     * @return true если формат правильный
     */
    public boolean isValidFormat(String apiKey) {
        if (apiKey == null || apiKey.isEmpty()) {
            return false;
        }

        // API Key должен быть 32 символа, только буквы a-z и цифры 0-9, дефис и подчеркивание
        return apiKey.matches("^[a-z0-9_-]{32}$");
    }

    /**
     * Маскировать API Key для логов (показать только первые и последние символы)
     *
     * @param apiKey - ключ для маскирования
     * @return замаскированный ключ (например: "a7k9m2...n9h5j2")
     */
    public String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() < 12) {
            return "***";
        }

        return apiKey.substring(0, 6) + "..." + apiKey.substring(apiKey.length() - 6);
    }
}