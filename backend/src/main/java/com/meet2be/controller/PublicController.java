package com.meet2be.controller;

import com.meet2be.model.dto.EventSummaryDto;
import com.meet2be.model.response.PublicJoinResponse;
import com.meet2be.service.EventCapacityService;
import com.meet2be.service.SessionService;
import com.meet2be.model.dto.SessionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.meet2be.service.EventService;
import com.meet2be.dao.entity.Event;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final EventService eventService;
    private final SessionService sessionService;
    private final EventCapacityService eventCapacityService;

    @GetMapping("/join/{joinCode}")
    public ResponseEntity<PublicJoinResponse> join(
            @PathVariable String joinCode,
            @RequestParam(required = false) String voterToken) {
        Event event = eventService.getJoinableByJoinCode(joinCode);

        // Enforced before the response is built, not after: a full event should
        // never hand back sessions and a join code the attendee cannot use.
        eventCapacityService.registerJoin(event.getId(), voterToken);

        var sessions = sessionService.listForEvent(event.getId()).stream()
                .map(SessionDto::from)
                .toList();
        return ResponseEntity.ok(new PublicJoinResponse(EventSummaryDto.from(event), sessions));
    }
}
