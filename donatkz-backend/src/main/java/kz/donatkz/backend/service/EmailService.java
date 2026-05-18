package kz.donatkz.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendVerificationEmail(String to, String username, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Подтверждение регистрации на DonatKZ");

            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("verificationLink", frontendUrl + "/verify-email?token=" + token);

            String htmlContent = templateEngine.process("verification-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Verification email sent to: {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send verification email to: {}", to, e);
            throw new RuntimeException("Не удалось отправить письмо: " + e.getMessage());
        }
    }

    public void sendWelcomeEmail(String to, String username) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Добро пожаловать в DonatKZ!");

            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("dashboardLink", frontendUrl + "/dashboard");

            String htmlContent = templateEngine.process("welcome-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Welcome email sent to: {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send welcome email to: {}", to, e);
        }
    }

    public void sendPasswordResetEmail(String to, String username, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Сброс пароля DonatKZ");

            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("resetLink", frontendUrl + "/reset-password?token=" + token);

            String htmlContent = templateEngine.process("reset-password-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password reset email sent to: {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send password reset email to: {}", to, e);
            throw new RuntimeException("Не удалось отправить письмо: " + e.getMessage());
        }
    }
}