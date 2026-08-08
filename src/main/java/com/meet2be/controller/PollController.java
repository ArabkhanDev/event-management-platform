package com.meet2be.controller;

import com.meet2be.util.CurrentUser;
import com.meet2be.exception.ApiException;
import com.meet2be.model.request.CreatePollRequest;
import com.meet2be.model.dto.PollDto;
import com.meet2be.model.request.UpdatePollStatusRequest;
import com.meet2be.model.request.VoteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.meet2be.service.PollService;
import com.meet2be.dao.entity.Poll;

@RestController
@RequiredArgsConstructor
public class PollController {

    private final PollService pollService;

    @PostMapping("/api/sessions/{sessionId}/polls")
    public ResponseEntity<PollDto> create(@PathVariable Long sessionId, @RequestBody CreatePollRequest request) {
        Poll poll = pollService.create(sessionId, CurrentUser.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pollService.getResults(poll.getId()));
    }

    @GetMapping("/api/sessions/{sessionId}/polls")
    public ResponseEntity<List<PollDto>> listForSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(pollService.listForSession(sessionId, CurrentUser.id()));
    }

    @PatchMapping("/api/polls/{id}")
    public ResponseEntity<PollDto> updateStatus(@PathVariable Long id, @RequestBody UpdatePollStatusRequest request) {
        if (request.getStatus() == null) {
            throw ApiException.badRequest("error.common.statusRequired");
        }
        Poll poll = pollService.setStatus(id, CurrentUser.id(), request.getStatus());
        return ResponseEntity.ok(pollService.getResults(poll.getId()));
    }

    @PostMapping("/api/public/polls/{id}/vote")
    public ResponseEntity<PollDto> vote(@PathVariable Long id,
                                         @RequestHeader(value = "X-Voter-Token", required = false) String voterToken,
                                         @RequestBody VoteRequest request) {
        return ResponseEntity.ok(pollService.vote(id, voterToken, request.getOptionId()));
    }

    @GetMapping("/api/public/polls/{id}/results")
    public ResponseEntity<PollDto> getResults(@PathVariable Long id) {
        return ResponseEntity.ok(pollService.getResults(id));
    }
}
