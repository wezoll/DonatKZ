package kz.donatkz.backend.exception;

public class SubscriptionExpiredException extends RuntimeException {

    public SubscriptionExpiredException(String message) {
        super(message);
    }

    public SubscriptionExpiredException(String message, Throwable cause) {
        super(message, cause);
    }
}