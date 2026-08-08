package com.meet2be.exception;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private Instant timestamp;
    private int status;
    private String error;
    private String message;

    /**
     * Stable, non-localised identifier for clients that must branch on the
     * reason rather than show it. Omitted from the payload when absent
     * (Jackson is configured to drop nulls), so existing responses are
     * byte-for-byte unchanged.
     */
    private String code;

    public static ErrorResponse of(int status, String error, String message) {
        return of(status, error, message, null);
    }

    public static ErrorResponse of(int status, String error, String message, String code) {
        return new ErrorResponse(Instant.now(), status, error, message, code);
    }
}
