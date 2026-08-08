package com.meet2be.service;

import com.meet2be.model.dto.StageStateDto;

public interface StageStateService {

    StageStateDto buildStageState(Long sessionId);

    /**
     * Attendee-facing variant. Separate from {@link #buildStageState} because
     * that one also feeds the internal WebSocket broadcast, which must keep
     * working regardless of what an attendee is currently allowed to see.
     */
    StageStateDto getPublicStageState(Long sessionId);

    void broadcastStageState(Long sessionId);
}
