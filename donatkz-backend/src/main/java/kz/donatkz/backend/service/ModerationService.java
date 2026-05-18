package kz.donatkz.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import kz.donatkz.backend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Сервис для модерации текста донатов
 * Фильтрует запрещенные слова перед отправкой в виджет
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ModerationService {

    private final ObjectMapper objectMapper;

    /**
     * Применить модерацию к тексту
     * 
     * @param text - исходный текст
     * @param user - пользователь (владелец настроек модерации)
     * @return отфильтрованный текст
     */
    public String moderateText(String text, User user) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        // Если модерация отключена - вернуть как есть
        if (user.getModerationEnabled() == null || !user.getModerationEnabled()) {
            return text;
        }

        // Получить список запрещенных слов
        List<String> bannedWords = parseBannedWords(user.getBannedWords());
        
        if (bannedWords.isEmpty()) {
            return text;
        }

        // Применить фильтр к каждому слову
        String moderatedText = text;
        for (String bannedWord : bannedWords) {
            if (bannedWord == null || bannedWord.trim().isEmpty()) {
                continue;
            }

            // Создать regex для поиска слова (case-insensitive, целое слово или часть слова)
            // Паттерн: ищем слово целиком или как часть другого слова
            String regex = "(?i)" + Pattern.quote(bannedWord.trim());
            
            // Заменить на звёздочки той же длины
            String replacement = "*".repeat(bannedWord.trim().length());
            
            moderatedText = moderatedText.replaceAll(regex, replacement);
        }

        if (!moderatedText.equals(text)) {
            log.info("Moderation applied: original length={}, moderated length={}, bannedWords count={}", 
                    text.length(), moderatedText.length(), bannedWords.size());
        }

        return moderatedText;
    }

    /**
     * Проверить, содержит ли текст запрещенные слова
     * 
     * @param text - текст для проверки
     * @param user - пользователь (владелец настроек модерации)
     * @return true если текст содержит запрещенные слова
     */
    public boolean containsBannedWords(String text, User user) {
        if (text == null || text.isEmpty()) {
            return false;
        }

        if (user.getModerationEnabled() == null || !user.getModerationEnabled()) {
            return false;
        }

        List<String> bannedWords = parseBannedWords(user.getBannedWords());
        
        if (bannedWords.isEmpty()) {
            return false;
        }

        String lowerText = text.toLowerCase();
        
        for (String bannedWord : bannedWords) {
            if (bannedWord == null || bannedWord.trim().isEmpty()) {
                continue;
            }
            
            if (lowerText.contains(bannedWord.trim().toLowerCase())) {
                return true;
            }
        }

        return false;
    }


    private List<String> parseBannedWords(String bannedWordsJson) {
        try {
            if (bannedWordsJson == null || bannedWordsJson.trim().isEmpty()) {
                return List.of();
            }
            
            return objectMapper.readValue(bannedWordsJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.error("Failed to parse banned words JSON: {}", bannedWordsJson, e);
            return List.of();
        }
    }
}


