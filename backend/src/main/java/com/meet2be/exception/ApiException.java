package com.meet2be.exception;

import org.springframework.http.HttpStatus;

/**
 * The message carried by this exception is a message-bundle key (see
 * messages*.properties), not display text — GlobalExceptionHandler resolves
 * it against the request's locale before it ever reaches a client.
 */
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final Object[] args;

    public ApiException(HttpStatus status, String messageKey, Object... args) {
        super(messageKey);
        this.status = status;
        this.args = args;
    }

    public static ApiException notFound(String messageKey, Object... args) {
        return new ApiException(HttpStatus.NOT_FOUND, messageKey, args);
    }

    public static ApiException badRequest(String messageKey, Object... args) {
        return new ApiException(HttpStatus.BAD_REQUEST, messageKey, args);
    }

    public static ApiException forbidden(String messageKey, Object... args) {
        return new ApiException(HttpStatus.FORBIDDEN, messageKey, args);
    }

    public static ApiException conflict(String messageKey, Object... args) {
        return new ApiException(HttpStatus.CONFLICT, messageKey, args);
    }

    public static ApiException serviceUnavailable(String messageKey, Object... args) {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, messageKey, args);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Object[] getArgs() {
        return args;
    }
}
