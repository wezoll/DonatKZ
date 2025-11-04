package kz.donatkz.backend.controller;

import jakarta.validation.Valid;
import kz.donatkz.backend.dto.*;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.service.GoalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class GoalController {

    private final GoalService goalService;
    private final UserRepository userRepository;

    /**
     * Создать новую цель
     * POST /api/goals
     */
    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody GoalCreateRequest request) {
        
        User user = getUserFromDetails(userDetails);
        log.info("Creating goal for user: {}", user.getUsername());
        GoalResponse response = goalService.createGoal(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Получить все цели текущего пользователя
     * GET /api/goals
     */
    @GetMapping
    public ResponseEntity<List<GoalResponse>> getUserGoals(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUserFromDetails(userDetails);
        log.info("Fetching goals for user: {}", user.getUsername());
        List<GoalResponse> goals = goalService.getUserGoals(user);
        return ResponseEntity.ok(goals);
    }

    /**
     * Получить активные цели текущего пользователя
     * GET /api/goals/active
     */
    @GetMapping("/active")
    public ResponseEntity<List<GoalResponse>> getActiveGoals(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUserFromDetails(userDetails);
        log.info("Fetching active goals for user: {}", user.getUsername());
        List<GoalResponse> goals = goalService.getActiveGoals(user);
        return ResponseEntity.ok(goals);
    }

    /**
     * Получить цель по ID
     * GET /api/goals/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<GoalResponse> getGoalById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        
        User user = getUserFromDetails(userDetails);
        log.info("Fetching goal {} for user: {}", id, user.getUsername());
        GoalResponse goal = goalService.getGoalById(user, id);
        return ResponseEntity.ok(goal);
    }

    /**
     * Обновить цель
     * PUT /api/goals/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> updateGoal(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody GoalUpdateRequest request) {
        
        User user = getUserFromDetails(userDetails);
        log.info("Updating goal {} for user: {}", id, user.getUsername());
        GoalResponse goal = goalService.updateGoal(user, id, request);
        return ResponseEntity.ok(goal);
    }

    /**
     * Обновить дизайн цели
     * PUT /api/goals/{id}/design
     */
    @PutMapping("/{id}/design")
    public ResponseEntity<GoalResponse> updateGoalDesign(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody GoalDesignUpdateRequest request) {
        
        User user = getUserFromDetails(userDetails);
        log.info("Updating goal design {} for user: {}", id, user.getUsername());
        GoalResponse goal = goalService.updateGoalDesign(user, id, request);
        return ResponseEntity.ok(goal);
    }

    /**
     * Удалить цель
     * DELETE /api/goals/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        
        User user = getUserFromDetails(userDetails);
        log.info("Deleting goal {} for user: {}", id, user.getUsername());
        goalService.deleteGoal(user, id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Получить данные для виджета цели (публичный endpoint)
     * GET /api/goals/widget/{apiKey}/{id}
     */
    @GetMapping("/widget/{apiKey}/{id}")
    public ResponseEntity<GoalResponse> getGoalForWidget(
            @PathVariable String apiKey,
            @PathVariable Long id) {
        log.info("Fetching goal widget data for goal: {} with API key", id);
        GoalResponse goal = goalService.getGoalForWidgetByApiKey(apiKey, id);
        return ResponseEntity.ok(goal);
    }

    /**
     * Вспомогательный метод для получения User из UserDetails
     */
    private User getUserFromDetails(UserDetails userDetails) {
        String username = userDetails.getUsername();
        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
    }
}

