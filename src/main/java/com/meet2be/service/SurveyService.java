package com.meet2be.service;

import com.meet2be.dao.entity.Survey;
import com.meet2be.dao.entity.SurveyQuestion;
import com.meet2be.model.enums.SurveyStatus;
import com.meet2be.model.request.CreateSurveyRequest;
import com.meet2be.model.request.SubmitAnswerRequest;
import com.meet2be.model.dto.SurveyResultsDto;

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
