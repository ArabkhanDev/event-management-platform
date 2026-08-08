package com.meet2be.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import com.meet2be.model.dto.StageStateDto;
import com.meet2be.service.StageStateService;

@RestController
@RequiredArgsConstructor
public class StageStateController {

    private final StageStateService stageStateService;

    @GetMapping("/api/public/sessions/{id}/stage-state")
    public ResponseEntity<StageStateDto> getStageState(@PathVariable Long id) {
        return ResponseEntity.ok(stageStateService.getPublicStageState(id));
    }
}
