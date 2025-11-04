package kz.donatkz.backend.controller;

import jakarta.validation.Valid;
import kz.donatkz.backend.dto.admin.*;
import kz.donatkz.backend.exception.BadRequestException;
import kz.donatkz.backend.exception.ResourceNotFoundException;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    /**
     * Проверка прав администратора
     */
    private void checkAdminAccess(UserDetails userDetails) {
        User user = getUserFromDetails(userDetails);
        String role = user.getRole();
        
        if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
            throw new BadRequestException("Доступ запрещен. Требуются права администратора.");
        }
    }

    /**
     * Проверка прав главного администратора
     */
    private void checkSuperAdminAccess(UserDetails userDetails) {
        User user = getUserFromDetails(userDetails);
        String role = user.getRole();
        
        if (!"SUPERADMIN".equals(role)) {
            throw new BadRequestException("Доступ запрещен. Требуются права главного администратора.");
        }
    }

    // ========== USER MANAGEMENT ==========

    /**
     * GET /api/admin/users
     * Получить всех пользователей
     */
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getAllUsers(
            @AuthenticationPrincipal UserDetails userDetails) {
        checkAdminAccess(userDetails);
        List<AdminUserDto> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * PUT /api/admin/users/{id}/role
     * Изменить роль пользователя (только для SUPERADMIN)
     */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<AdminUserDto> updateUserRole(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        checkSuperAdminAccess(userDetails);
        AdminUserDto user = adminService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(user);
    }

    /**
     * PUT /api/admin/users/{id}/tariff
     * Изменить тариф пользователя
     */
    @PutMapping("/users/{id}/tariff")
    public ResponseEntity<AdminUserDto> updateUserTariff(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserTariffRequest request) {
        checkAdminAccess(userDetails);
        AdminUserDto user = adminService.updateUserTariff(
                id, 
                request.getTariff(), 
                request.getTariffStart(), 
                request.getTariffEnd()
        );
        return ResponseEntity.ok(user);
    }

    /**
     * DELETE /api/admin/users/{id}
     * Удалить пользователя
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        checkAdminAccess(userDetails);
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ========== NEWS MANAGEMENT ==========

    /**
     * GET /api/admin/news
     * Получить все новости
     */
    @GetMapping("/news")
    public ResponseEntity<List<NewsDto>> getAllNews(
            @AuthenticationPrincipal UserDetails userDetails) {
        checkAdminAccess(userDetails);
        List<NewsDto> news = adminService.getAllNews();
        return ResponseEntity.ok(news);
    }

    /**
     * POST /api/admin/news
     * Создать новость
     */
    @PostMapping("/news")
    public ResponseEntity<NewsDto> createNews(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody NewsCreateRequest request) {
        checkAdminAccess(userDetails);
        NewsDto news = adminService.createNews(request);
        return ResponseEntity.ok(news);
    }

    /**
     * PUT /api/admin/news/{id}
     * Обновить новость
     */
    @PutMapping("/news/{id}")
    public ResponseEntity<NewsDto> updateNews(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody NewsCreateRequest request) {
        checkAdminAccess(userDetails);
        NewsDto news = adminService.updateNews(id, request);
        return ResponseEntity.ok(news);
    }

    /**
     * DELETE /api/admin/news/{id}
     * Удалить новость
     */
    @DeleteMapping("/news/{id}")
    public ResponseEntity<Void> deleteNews(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        checkAdminAccess(userDetails);
        adminService.deleteNews(id);
        return ResponseEntity.noContent().build();
    }

    // ========== FAQ MANAGEMENT ==========

    /**
     * GET /api/admin/faq
     * Получить все FAQ
     */
    @GetMapping("/faq")
    public ResponseEntity<List<FaqDto>> getAllFaq(
            @AuthenticationPrincipal UserDetails userDetails) {
        checkAdminAccess(userDetails);
        List<FaqDto> faq = adminService.getAllFaq();
        return ResponseEntity.ok(faq);
    }

    /**
     * POST /api/admin/faq
     * Создать FAQ
     */
    @PostMapping("/faq")
    public ResponseEntity<FaqDto> createFaq(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FaqCreateRequest request) {
        checkAdminAccess(userDetails);
        FaqDto faq = adminService.createFaq(request);
        return ResponseEntity.ok(faq);
    }

    /**
     * PUT /api/admin/faq/{id}
     * Обновить FAQ
     */
    @PutMapping("/faq/{id}")
    public ResponseEntity<FaqDto> updateFaq(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody FaqCreateRequest request) {
        checkAdminAccess(userDetails);
        FaqDto faq = adminService.updateFaq(id, request);
        return ResponseEntity.ok(faq);
    }

    /**
     * DELETE /api/admin/faq/{id}
     * Удалить FAQ
     */
    @DeleteMapping("/faq/{id}")
    public ResponseEntity<Void> deleteFaq(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        checkAdminAccess(userDetails);
        adminService.deleteFaq(id);
        return ResponseEntity.noContent().build();
    }

    // ========== HELPER METHODS ==========

    private User getUserFromDetails(UserDetails userDetails) {
        String username = userDetails.getUsername();

        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
    }
}
