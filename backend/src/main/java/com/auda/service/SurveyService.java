package com.auda.service;

import com.auda.dao.entity.Survey;
import com.auda.dao.entity.SurveyQuestion;
import com.auda.model.enums.SurveyStatus;
import com.auda.model.request.CreateSurveyRequest;
import com.auda.model.request.SubmitAnswerRequest;
import com.auda.model.dto.SurveyResultsDto;

import java.util.List;

public interface SurveyService {

    Survey create(Long sessionId, Long requesterId, CreateSurveyRequest request);

    Survey setStatus(Long id, Long requesterId, SurveyStatus status);

    List<SurveyQuestion> listQuestions(Long surveyId);

    Survey getById(Long id);

    List<Survey> listForSession(Long sessionId, Long requesterId);

    Survey getActiveForSession(Long sessionId);

    void submitResponse(Long surveyId, String voterToken, List<SubmitAnswerRequest> answers);

    SurveyResultsDto getResults(Long surveyId, Long requesterId);
}
