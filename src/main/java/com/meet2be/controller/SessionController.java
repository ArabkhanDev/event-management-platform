package com.meet2be.controller;

import com.meet2be.util.CurrentUser;
import com.meet2be.model.request.CreateSessionRequest;
import com.meet2be.model.dto.SessionDto;
import com.meet2be.model.request.UpdateSessionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.meet2be.service.SessionService;
import com.meet2be.dao.entity.Session;

@RestController
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping("/api/events/{eventId}/sessions")
    public ResponseEntity<SessionDto> create(@PathVariable Long eventId, @RequestBody CreateSessionRequest request) {
        Session session = sessionService.create(eventId, CurrentUser.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(SessionDto.from(session));
    }

    @GetMapping("/api/sessions/{id}")
    public ResponseEntity<SessionDto> get(@PathVariable Long id) {
        Session session = sessionService.getOwned(id, CurrentUser.id());
        return ResponseEntity.ok(SessionDto.from(session));
    }

    @PatchMapping("/api/sessions/{id}")
    public ResponseEntity<SessionDto> update(@PathVariable Long id, @RequestBody UpdateSessionRequest request) {
        Session session = sessionService.update(id, CurrentUser.id(), request);
        return ResponseEntity.ok(SessionDto.from(session));
    }
}
