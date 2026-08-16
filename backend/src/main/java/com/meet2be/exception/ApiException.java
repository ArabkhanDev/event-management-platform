package com.meet2be.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * The message carried by this exception is a message-bundle key (see
 * messages*.properties), not display text — GlobalExceptionHandler resolves
 * it against the request's locale before it ever reaches a client.
 */
@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final Object[] args;

    /**
     * Optional stable identifier for cases the client must branch on rather
     * than merely display — e.g. telling "not started yet" apart from "ended"
     * so the attendee app can show the right screen. Null for the majority of
     * errors, where the localised message is the whole payload.
     */
    private final String code;

    public ApiException(HttpStatus status, String messageKey, Object... args) {
        this(status, null, messageKey, args);
    }

    public ApiException(HttpStatus status, String code, String messageKey, Object... args) {
        super(messageKey);
        this.status = status;
        this.code = code;
        this.args = args;
    }

    /** Factory for the coded variant; the no-code helpers below stay unchanged. */
    public static ApiException of(HttpStatus status, String code, String messageKey, Object... args) {
        return new ApiException(status, code, messageKey, args);
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

}
