package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.*;
import kz.donatkz.backend.model.Goal;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.DonationRepository;
import kz.donatkz.backend.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoalService {

    private final GoalRepository goalRepository;
    private final DonationRepository donationRepository;

    /**
     * Создать новую цель
     */
    @Transactional
    public GoalResponse createGoal(User user, GoalCreateRequest request) {
        log.info("Creating goal for user: {}", user.getUsername());

        Goal goal = Goal.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .targetAmount(request.getTargetAmount())
                .isActive(true)
                .build();

        Goal savedGoal = goalRepository.save(goal);
        log.info("Goal created with ID: {}", savedGoal.getId());

        return convertToResponse(savedGoal, user);
    }

    /**
     * Получить все цели пользователя
     */
    @Transactional(readOnly = true)
    public List<GoalResponse> getUserGoals(User user) {
        log.info("Fetching goals for user: {}", user.getUsername());
        
        List<Goal> goals = goalRepository.findByUserOrderByCreatedAtDesc(user);
        
        return goals.stream()
                .map(goal -> convertToResponse(goal, user))
                .collect(Collectors.toList());
    }

    /**
     * Получить активные цели пользователя
     */
    @Transactional(readOnly = true)
    public List<GoalResponse> getActiveGoals(User user) {
        log.info("Fetching active goals for user: {}", user.getUsername());
        
        List<Goal> goals = goalRepository.findByUserAndIsActiveTrueOrderByCreatedAtDesc(user);
        
        return goals.stream()
                .map(goal -> convertToResponse(goal, user))
                .collect(Collectors.toList());
    }

    /**
     * Получить цель по ID
     */
    @Transactional(readOnly = true)
    public GoalResponse getGoalById(User user, Long goalId) {
        Goal goal = goalRepository.findByIdAndUser(goalId, user)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        
        return convertToResponse(goal, user);
    }

    /**
     * Обновить цель
     */
    @Transactional
    public GoalResponse updateGoal(User user, Long goalId, GoalUpdateRequest request) {
        log.info("Updating goal {} for user: {}", goalId, user.getUsername());

        Goal goal = goalRepository.findByIdAndUser(goalId, user)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (request.getTitle() != null) {
            goal.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            goal.setDescription(request.getDescription());
        }
        if (request.getTargetAmount() != null) {
            goal.setTargetAmount(request.getTargetAmount());
        }
        if (request.getIsActive() != null) {
            goal.setIsActive(request.getIsActive());
        }

        Goal updatedGoal = goalRepository.save(goal);
        log.info("Goal {} updated successfully", goalId);

        return convertToResponse(updatedGoal, user);
    }

    /**
     * Обновить дизайн цели
     */
    @Transactional
    public GoalResponse updateGoalDesign(User user, Long goalId, GoalDesignUpdateRequest request) {
        log.info("Updating goal design {} for user: {}", goalId, user.getUsername());

        Goal goal = goalRepository.findByIdAndUser(goalId, user)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (request.getHeight() != null) goal.setHeight(request.getHeight());
        if (request.getBorderRadius() != null) goal.setBorderRadius(request.getBorderRadius());
        if (request.getStrokeWidth() != null) goal.setStrokeWidth(request.getStrokeWidth());
        if (request.getStrokeColor() != null) goal.setStrokeColor(request.getStrokeColor());
        if (request.getBackgroundColor() != null) goal.setBackgroundColor(request.getBackgroundColor());
        if (request.getUseGradient() != null) goal.setUseGradient(request.getUseGradient());
        if (request.getGradientFillColor1() != null) goal.setGradientFillColor1(request.getGradientFillColor1());
        if (request.getGradientFillColor2() != null) goal.setGradientFillColor2(request.getGradientFillColor2());
        if (request.getGradientAngle() != null) goal.setGradientAngle(request.getGradientAngle());
        if (request.getUseColor() != null) goal.setUseColor(request.getUseColor());
        if (request.getShowBackground() != null) goal.setShowBackground(request.getShowBackground());
        if (request.getTitlePosition() != null) goal.setTitlePosition(request.getTitlePosition());
        if (request.getProgressPosition() != null) goal.setProgressPosition(request.getProgressPosition());
        if (request.getProgressDisplay() != null) goal.setProgressDisplay(request.getProgressDisplay());
        if (request.getTitleTextStyle() != null) goal.setTitleTextStyle(request.getTitleTextStyle());
        if (request.getProgressTextStyle() != null) goal.setProgressTextStyle(request.getProgressTextStyle());

        Goal updatedGoal = goalRepository.save(goal);
        log.info("Goal design {} updated successfully", goalId);

        return convertToResponse(updatedGoal, user);
    }

    /**
     * Удалить цель
     */
    @Transactional
    public void deleteGoal(User user, Long goalId) {
        log.info("Deleting goal {} for user: {}", goalId, user.getUsername());

        Goal goal = goalRepository.findByIdAndUser(goalId, user)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        goalRepository.delete(goal);
        log.info("Goal {} deleted successfully", goalId);
    }

    /**
     * Получить данные для виджета цели (публичный endpoint)
     * @deprecated Используйте getGoalForWidgetByApiKey
     */
    @Deprecated
    @Transactional(readOnly = true)
    public GoalResponse getGoalForWidget(Long goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getIsActive()) {
            throw new RuntimeException("Goal is not active");
        }

        return convertToResponse(goal, goal.getUser());
    }

    /**
     * Получить данные для виджета цели по API ключу и ID
     */
    @Transactional(readOnly = true)
    public GoalResponse getGoalForWidgetByApiKey(String apiKey, Long goalId) {
        log.info("Fetching goal {} for widget with API key: {}", goalId, apiKey.substring(0, 8) + "...");

        // Найти цель по ID
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        // Проверить, что API ключ совпадает с владельцем цели
        User goalOwner = goal.getUser();
        if (!apiKey.equals(goalOwner.getWebsocketApiKey())) {
            throw new RuntimeException("Invalid API key for this goal");
        }

        // Проверить, что цель активна
        if (!goal.getIsActive()) {
            throw new RuntimeException("Goal is not active");
        }

        return convertToResponse(goal, goalOwner);
    }

    /**
     * Конвертировать Goal в GoalResponse
     */
    @Transactional(readOnly = true)
    private GoalResponse convertToResponse(Goal goal, User user) {
        // Подсчитываем собранную сумму из донатов пользователя
        BigDecimal collectedAmount = donationRepository.sumDonationsByUser(user)
                .orElse(BigDecimal.ZERO);

        // Вычисляем процент и оставшуюся сумму
        BigDecimal targetAmount = goal.getTargetAmount();
        int percentage = 0;
        BigDecimal remaining = targetAmount;

        if (targetAmount.compareTo(BigDecimal.ZERO) > 0) {
            percentage = collectedAmount
                    .multiply(BigDecimal.valueOf(100))
                    .divide(targetAmount, 0, RoundingMode.HALF_UP)
                    .intValue();
            percentage = Math.min(100, percentage);
            remaining = targetAmount.subtract(collectedAmount);
            if (remaining.compareTo(BigDecimal.ZERO) < 0) {
                remaining = BigDecimal.ZERO;
            }
        }

        // Создаём DTO дизайна
        GoalDesignDto design = GoalDesignDto.builder()
                .height(goal.getHeight())
                .borderRadius(goal.getBorderRadius())
                .strokeWidth(goal.getStrokeWidth())
                .strokeColor(goal.getStrokeColor())
                .backgroundColor(goal.getBackgroundColor())
                .useGradient(goal.getUseGradient())
                .gradientFillColor1(goal.getGradientFillColor1())
                .gradientFillColor2(goal.getGradientFillColor2())
                .gradientAngle(goal.getGradientAngle())
                .useColor(goal.getUseColor())
                .showBackground(goal.getShowBackground())
                .titlePosition(goal.getTitlePosition())
                .progressPosition(goal.getProgressPosition())
                .progressDisplay(goal.getProgressDisplay())
                .titleTextStyle(goal.getTitleTextStyle())
                .progressTextStyle(goal.getProgressTextStyle())
                .build();

        // Widget URL с API ключом
        String apiKey = user.getWebsocketApiKey();
        String widgetUrl = String.format("http://localhost:5173/goal-widget/%s/%d", apiKey, goal.getId());

        return GoalResponse.builder()
                .id(goal.getId())
                .title(goal.getTitle())
                .description(goal.getDescription())
                .targetAmount(targetAmount)
                .collectedAmount(collectedAmount)
                .percentage(percentage)
                .remaining(remaining)
                .isActive(goal.getIsActive())
                .widgetUrl(widgetUrl)
                .design(design)
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }
}

