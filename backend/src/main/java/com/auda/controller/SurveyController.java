package com.auda.controller;

import com.auda.util.CurrentUser;
import com.auda.exception.ApiException;
import com.auda.model.request.CreateSurveyRequest;
import com.auda.model.request.SubmitSurveyResponseRequest;
import com.auda.model.dto.SurveyDto;
import com.auda.model.dto.SurveyQuestionDto;
import com.auda.model.dto.SurveyResultsDto;
import com.auda.model.request.UpdateSurveyStatusRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.auda.dao.entity.Survey;
import com.auda.service.SurveyService;

@RestController
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @PostMapping("/api/sessions/{sessionId}/surveys")
    public ResponseEntity<SurveyDto> create(@PathVariable Long sessionId, @RequestBody CreateSurveyRequest request) {
        Survey survey = surveyService.create(sessionId, CurrentUser.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(survey));
    }

    @GetMapping("/api/sessions/{sessionId}/surveys")
    public ResponseEntity<List<SurveyDto>> listForSession(@PathVariable Long sessionId) {
        List<SurveyDto> surveys = surveyService.listForSession(sessionId, CurrentUser.id()).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(surveys);
    }

    @GetMapping("/api/public/sessions/{sessionId}/active-survey")
    public ResponseEntity<SurveyDto> activeForSession(@PathVariable Long sessionId) {
        Survey survey = surveyService.getActiveForSession(sessionId);
        if (survey == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(toDto(survey));
    }

    @PatchMapping("/api/surveys/{id}")
    public ResponseEntity<SurveyDto> updateStatus(@PathVariable Long id, @RequestBody UpdateSurveyStatusRequest request) {
        Survey survey = surveyService.setStatus(id, CurrentUser.id(), request.getStatus());
        return ResponseEntity.ok(toDto(survey));
    }

    @PostMapping("/api/public/surveys/{id}/responses")
    public ResponseEntity<Void> submitResponse(@PathVariable Long id,
                                                @RequestHeader(value = "X-Voter-Token", required = false) String voterToken,
                                                @RequestBody SubmitSurveyResponseRequest request) {
        if (request.getAnswers() == null) {
            throw ApiException.badRequest("error.survey.answersRequired");
        }
        surveyService.submitResponse(id, voterToken, request.getAnswers());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/surveys/{id}/results")
    public ResponseEntity<SurveyResultsDto> getResults(@PathVariable Long id) {
        return ResponseEntity.ok(surveyService.getResults(id, CurrentUser.id()));
    }

    private SurveyDto toDto(Survey survey) {
        var questions = surveyService.listQuestions(survey.getId()).stream()
                .map(SurveyQuestionDto::from)
                .toList();
        return SurveyDto.from(survey, questions);
    }
}
