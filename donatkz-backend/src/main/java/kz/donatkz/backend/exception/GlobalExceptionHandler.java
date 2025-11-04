package kz.donatkz.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 400 - Bad Request (неверные данные, валидация не прошла)
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException ex) {
        log.error("Bad Request: {}", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse(
                        HttpStatus.BAD_REQUEST.value(),
                        "Bad Request",
                        ex.getMessage()
                ));
    }

    /**
     * 404 - Not Found (ресурс не найден)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        log.error("Resource Not Found: {}", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse(
                        HttpStatus.NOT_FOUND.value(),
                        "Not Found",
                        ex.getMessage()
                ));
    }

    /**
     * 401 - Unauthorized (не авторизован, токен невалиден)
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedException ex) {
        log.error("Unauthorized: {}", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorResponse(
                        HttpStatus.UNAUTHORIZED.value(),
                        "Unauthorized",
                        ex.getMessage()
                ));
    }

    /**
     * 402 - Payment Required (подписка истекла)
     */
    @ExceptionHandler(SubscriptionExpiredException.class)
    public ResponseEntity<Map<String, Object>> handleSubscriptionExpired(SubscriptionExpiredException ex) {
        log.error("Subscription Expired: {}", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.PAYMENT_REQUIRED)
                .body(buildErrorResponse(
                        HttpStatus.PAYMENT_REQUIRED.value(),
                        "Subscription Expired",
                        ex.getMessage()
                ));
    }

    /**
     * 429 - Too Many Requests (превышен лимит донатов)
     */
    @ExceptionHandler(DonationLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleDonationLimitExceeded(DonationLimitExceededException ex) {
        log.error("Donation Limit Exceeded: {}", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .body(buildErrorResponse(
                        HttpStatus.TOO_MANY_REQUESTS.value(),
                        "Donation Limit Exceeded",
                        ex.getMessage()
                ));
    }

    /**
     * 400 - Validation Errors (ошибки валидации полей DTO)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.error("Validation errors: {}", errors);

        Map<String, Object> response = buildErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                "Проверьте правильность введенных данных"
        );
        response.put("validationErrors", errors);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    /**
     * 500 - Internal Server Error (непредвиденная ошибка)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Internal Server Error: {}", ex.getMessage(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse(
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "Internal Server Error",
                        "Произошла непредвиденная ошибка. Попробуйте позже."
                ));
    }

    /**
     * Вспомогательный метод для построения error response
     */
    private Map<String, Object> buildErrorResponse(int status, String error, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("error", error);
        response.put("message", message);
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
}