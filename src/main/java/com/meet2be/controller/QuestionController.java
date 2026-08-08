package com.meet2be.controller;

import com.meet2be.util.CurrentUser;
import com.meet2be.exception.ApiException;
import com.meet2be.model.dto.QuestionDto;
import com.meet2be.model.request.SubmitQuestionRequest;
import com.meet2be.model.request.UpdateQuestionStatusRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.meet2be.service.QuestionService;
import com.meet2be.dao.entity.Question;

@RestController
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping("/api/public/sessions/{sessionId}/questions")
    public ResponseEntity<QuestionDto> submit(@PathVariable Long sessionId, @RequestBody SubmitQuestionRequest request) {
        Question question = questionService.submit(sessionId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(QuestionDto.from(question));
    }

    @GetMapping("/api/sessions/{sessionId}/questions")
    public ResponseEntity<List<QuestionDto>> listForSession(@PathVariable Long sessionId) {
        List<QuestionDto> questions = questionService.listForSession(sessionId, CurrentUser.id()).stream()
                .map(QuestionDto::from)
                .toList();
        return ResponseEntity.ok(questions);
    }

    @PatchMapping("/api/questions/{id}")
    public ResponseEntity<QuestionDto> updateStatus(@PathVariable Long id, @RequestBody UpdateQuestionStatusRequest request) {
        if (request.getStatus() == null) {
            throw ApiException.badRequest("error.common.statusRequired");
        }
        Question question = questionService.updateStatus(id, CurrentUser.id(), request.getStatus());
        return ResponseEntity.ok(QuestionDto.from(question));
    }
}
