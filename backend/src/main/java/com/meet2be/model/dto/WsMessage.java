package com.meet2be.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Envelope for all WebSocket broadcasts so the frontend can switch on `type`.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WsMessage<T> {
    private String type;
    private T payload;

    public static <T> WsMessage<T> of(String type, T payload) {
        return new WsMessage<>(type, payload);
    }
}
