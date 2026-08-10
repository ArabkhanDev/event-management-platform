package com.meet2be.service;

import com.meet2be.dao.entity.Presentation;
import com.meet2be.model.dto.PresentationFileDto;

/**
 * Where the uploaded PDF lives.
 *
 * <p>The database-backed implementation is a starting point, not the
 * destination: serving whole decks out of Postgres through the application
 * means every byte crosses the JVM, and deck downloads arrive in bursts — a
 * speaker announces them and the whole room taps at once. Swapping in an
 * object-store implementation (MinIO, S3) that returns a pre-signed URL only
 * changes what sits behind this interface; permission checks and callers stay
 * exactly as they are.
 */
public interface PresentationStorageService {

    void store(Presentation presentation, String contentType, byte[] data);

    PresentationFileDto load(Long presentationId);

    boolean exists(Long presentationId);

    void delete(Long presentationId);
}
