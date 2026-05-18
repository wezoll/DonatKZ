package kz.donatkz.backend.service;

import kz.donatkz.backend.dto.*;
import kz.donatkz.backend.model.User;
import kz.donatkz.backend.repository.UserRepository;
import kz.donatkz.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    @Value("${app.verification-token-expiration}")
    private long verificationTokenExpiration;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Проверка существования email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email уже используется");
        }

        // Проверка существования username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username уже занят");
        }

        // Проверка совпадения паролей
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Пароли не совпадают");
        }

        // Генерация токена верификации
        String verificationToken = UUID.randomUUID().toString();

        // Создание пользователя
        User user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setChannelUrl(request.getChannelUrl());
        user.setDisplayName(request.getUsername());
        user.setIsActive(false); // НЕ активен до верификации
        user.setIsEmailVerified(false);
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiresAt(
                LocalDateTime.now().plusSeconds(verificationTokenExpiration / 1000));
        user.setSubscriptionTier("FREE");

        User savedUser = userRepository.save(user);

        // Отправка email верификации
        try {
            emailService.sendVerificationEmail(
                    savedUser.getEmail(),
                    savedUser.getUsername(),
                    verificationToken);
        } catch (Exception e) {
            // Логируем ошибку, но не прерываем регистрацию
            System.err.println("Failed to send verification email: " + e.getMessage());
        }

        // Генерация токенов (пользователь может войти, но функции ограничены)
        String accessToken = jwtTokenProvider.generateAccessToken(savedUser.getUsername());
        String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser.getUsername());

        return new AuthResponse(
                accessToken,
                refreshToken,
                mapToDto(savedUser));
    }

    @Transactional
    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Неверный токен верификации"));

        // Проверка срока действия токена
        if (user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Токен верификации истек");
        }

        // Активация пользователя
        user.setIsEmailVerified(true);
        user.setIsActive(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);

        userRepository.save(user);

        // Отправка приветственного письма
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
        } catch (Exception e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }

        return "Email успешно подтвержден!";
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Поиск по username ИЛИ email
        User user = userRepository.findByUsername(request.getLogin())
                .or(() -> userRepository.findByEmail(request.getLogin()))
                .orElseThrow(() -> new BadCredentialsException("Неверный логин или пароль"));

        // Проверка пароля
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Неверный логин или пароль");
        }

        // Проверка верификации email (можно отключить, если хотите разрешить логин без
        // верификации)
        if (!user.getIsEmailVerified()) {
            throw new RuntimeException("Email не подтвержден. Проверьте почту.");
        }

        // Проверка активности аккаунта
        if (!user.getIsActive()) {
            throw new RuntimeException("Аккаунт заблокирован");
        }

        // Генерация токенов
        String accessToken = jwtTokenProvider.generateAccessToken(user.getUsername());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        return new AuthResponse(
                accessToken,
                refreshToken,
                mapToDto(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Недействительный или истёкший refresh токен");
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        String newAccessToken = jwtTokenProvider.generateAccessToken(username);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(username);

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                mapToDto(user));
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        return mapToDto(user);
    }

    @Transactional
    public String requestPasswordReset(String email) {
        // Не раскрываем существует ли email (защита от email enumeration)
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordTokenExpiresAt(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            try {
                emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), token);
            } catch (Exception e) {
                System.err.println("Failed to send reset email: " + e.getMessage());
            }
        });
        return "Если такой email зарегистрирован, мы отправили инструкцию по сбросу пароля.";
    }

    @Transactional
    public String resetPassword(String token, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("Пароли не совпадают");
        }

        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Недействительный или устаревший токен"));

        if (user.getResetPasswordTokenExpiresAt().isBefore(LocalDateTime.now())) {
            user.setResetPasswordToken(null);
            user.setResetPasswordTokenExpiresAt(null);
            userRepository.save(user);
            throw new RuntimeException("Ссылка сброса пароля устарела. Запросите новую.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiresAt(null);
        userRepository.save(user);

        return "Пароль успешно изменён";
    }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setUsername(user.getUsername());
        dto.setChannelUrl(user.getChannelUrl());
        dto.setDisplayName(user.getDisplayName());
        dto.setRole(user.getRole() != null ? user.getRole() : "USER");
        dto.setSubscriptionTier(user.getSubscriptionTier());
        dto.setKaspiPhone(user.getKaspiPhone());
        return dto;
    }
}