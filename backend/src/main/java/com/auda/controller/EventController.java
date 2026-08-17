package com.auda.controller;

import com.auda.util.CurrentUser;
import com.auda.model.request.CreateEventRequest;
import com.auda.model.dto.EventDto;
import com.auda.model.request.UpdateEventRequest;
import com.auda.service.SessionService;
import com.auda.model.dto.SessionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.auda.dao.entity.Event;
import com.auda.service.EventService;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<EventDto> create(@RequestBody CreateEventRequest request) {
        Event event = eventService.create(CurrentUser.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(event));
    }

    @GetMapping
    public ResponseEntity<List<EventDto>> listMine() {
        List<EventDto> events = eventService.listMine(CurrentUser.id()).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDto> getById(@PathVariable Long id) {
        Event event = eventService.getOwnedById(id, CurrentUser.id());
        return ResponseEntity.ok(toDto(event));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<EventDto> update(@PathVariable Long id, @RequestBody UpdateEventRequest request) {
        Event event = eventService.update(id, CurrentUser.id(), request);
        return ResponseEntity.ok(toDto(event));
    }

    private EventDto toDto(Event event) {
        List<SessionDto> sessions = sessionService.listForEvent(event.getId()).stream()
                .map(SessionDto::from)
                .toList();
        return EventDto.from(event, sessions);
    }
}
