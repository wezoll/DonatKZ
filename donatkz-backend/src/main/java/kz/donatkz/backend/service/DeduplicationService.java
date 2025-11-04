package kz.donatkz.backend.service;

import kz.donatkz.backend.repository.DonationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeduplicationService {

    private final DonationRepository donationRepository;

    /**
     * Генерация SHA-256 хэша для доната
     * Формат: userId + amount + senderName + timestamp (с точностью до минуты)
     */
    public String generateHash(Long userId, BigDecimal amount, String senderName, LocalDateTime timestamp) {
        try {
            // Убираем секунды из timestamp для создания 5-минутного окна дедупликации
            String timestampStr = timestamp.withSecond(0).withNano(0).toString();

            // Создаем строку для хэширования
            String data = String.format("%d|%s|%s|%s",
                    userId,
                    amount.toPlainString(),
                    senderName.trim().toLowerCase(),
                    timestampStr
            );

            // SHA-256 хэш
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));

            // Конвертируем в hex строку
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }

            String result = hexString.toString();
            log.debug("Generated hash for donation: userId={}, amount={}, sender={}, hash={}",
                    userId, amount, senderName, result);

            return result;

        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not found", e);
            throw new RuntimeException("Error generating deduplication hash", e);
        }
    }

    /**
     * Проверка, является ли донат дубликатом
     */
    public boolean isDuplicate(String hash) {
        boolean exists = donationRepository.existsByDeduplicationHash(hash);

        if (exists) {
            log.warn("Duplicate donation detected with hash: {}", hash);
        }

        return exists;
    }

    /**
     * Проверка дубликата по параметрам доната
     */
    public boolean isDuplicate(Long userId, BigDecimal amount, String senderName, LocalDateTime timestamp) {
        String hash = generateHash(userId, amount, senderName, timestamp);
        return isDuplicate(hash);
    }
}