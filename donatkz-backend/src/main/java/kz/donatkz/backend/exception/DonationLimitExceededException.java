package kz.donatkz.backend.exception;

public class DonationLimitExceededException extends RuntimeException {

    public DonationLimitExceededException(String message) {
        super(message);
    }

    public DonationLimitExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}