package com.meet2be.service;

import com.meet2be.model.dto.StageStateDto;

public interface StageStateService {

    StageStateDto buildStageState(Long sessionId);

    void broadcastStageState(Long sessionId);
}
