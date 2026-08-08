package com.meet2be.controller;

import com.meet2be.util.CurrentUser;
import com.meet2be.exception.ApiException;
import com.meet2be.model.request.CreateGameQuestionRequest;
import com.meet2be.model.dto.GameQuestionDto;
import com.meet2be.model.dto.SessionLeaderboardDto;
import com.meet2be.model.request.SubmitGameAnswerRequest;
import com.meet2be.model.request.UpdateGameStatusRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.meet2be.service.GameService;
import com.meet2be.dao.entity.GameQuestion;

@RestController
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @PostMapping("/api/sessions/{sessionId}/games")
    public ResponseEntity<GameQuestionDto> create(@PathVariable Long sessionId, @RequestBody CreateGameQuestionRequest request) {
        GameQuestion question = gameService.create(sessionId, CurrentUser.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(gameService.getResults(question.getId()));
    }

    @GetMapping("/api/sessions/{sessionId}/games")
    public ResponseEntity<List<GameQuestionDto>> listForSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(gameService.listForSession(sessionId, CurrentUser.id()));
    }

    @PatchMapping("/api/games/{id}")
    public ResponseEntity<GameQuestionDto> updateStatus(@PathVariable Long id, @RequestBody UpdateGameStatusRequest request) {
        if (request.getStatus() == null) {
            throw ApiException.badRequest("error.common.statusRequired");
        }
        GameQuestion question = gameService.setStatus(id, CurrentUser.id(), request.getStatus());
        return ResponseEntity.ok(gameService.getResults(question.getId()));
    }

    @PostMapping("/api/public/games/{id}/answer")
    public ResponseEntity<GameQuestionDto> answer(@PathVariable Long id,
                                                   @RequestHeader(value = "X-Voter-Token", required = false) String voterToken,
                                                   @RequestBody SubmitGameAnswerRequest request) {
        return ResponseEntity.ok(gameService.answer(id, voterToken, request.getOptionId(), request.getPlayerName()));
    }

    @GetMapping("/api/public/games/{id}/results")
    public ResponseEntity<GameQuestionDto> getResults(@PathVariable Long id) {
        return ResponseEntity.ok(gameService.getResults(id));
    }

    @GetMapping("/api/public/sessions/{sessionId}/leaderboard")
    public ResponseEntity<SessionLeaderboardDto> getLeaderboard(@PathVariable Long sessionId) {
        return ResponseEntity.ok(gameService.getLeaderboard(sessionId));
    }

    @GetMapping("/api/public/sessions/{sessionId}/active-game")
    public ResponseEntity<GameQuestionDto> activeForSession(@PathVariable Long sessionId) {
        GameQuestionDto question = gameService.getActiveForSession(sessionId);
        if (question == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(question);
    }
}
