package com.meet2be.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A stored deck ready to be sent to a client.
 *
 * <p>Carries the bytes directly because the current backing store is a
 * database column. When storage moves to an object store this gains a URL
 * instead, and the controller redirects rather than streaming.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PresentationFileDto {

    private String filename;
    private String contentType;
    private long sizeBytes;
    private byte[] data;
}
