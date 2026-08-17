package com.auda.service.handler;

import com.auda.dao.entity.Session;
import com.auda.dao.entity.Survey;
import com.auda.dao.entity.SurveyAnswer;
import com.auda.dao.entity.SurveyQuestion;
import com.auda.dao.entity.SurveyResponse;
import com.auda.dao.repository.SessionRepository;
import com.auda.dao.repository.SurveyAnswerRepository;
import com.auda.dao.repository.SurveyQuestionRepository;
import com.auda.dao.repository.SurveyRepository;
import com.auda.dao.repository.SurveyResponseRepository;
import com.auda.exception.ApiException;
import com.auda.model.dto.OptionCount;
import com.auda.model.dto.SurveyQuestionResultDto;
import com.auda.model.dto.SurveyResultsDto;
import com.auda.model.enums.SurveyQuestionType;
import com.auda.model.enums.SurveyStatus;
import com.auda.model.request.CreateSurveyQuestionRequest;
import com.auda.model.request.CreateSurveyRequest;
import com.auda.model.request.SubmitAnswerRequest;
import com.auda.service.OwnershipService;
import com.auda.service.SessionAccessService;
import com.auda.service.SurveyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SurveyServiceHandler implements SurveyService {

    private final SurveyRepository surveyRepository;
    private final SurveyQuestionRepository surveyQuestionRepository;
    private final SurveyResponseRepository surveyResponseRepository;
    private final SurveyAnswerRepository surveyAnswerRepository;
    private final SessionRepository sessionRepository;
    private final SessionAccessService sessionAccessService;
    private final OwnershipService ownershipService;

    @Override
    public Survey create(Long sessionId, Long requesterId, CreateSurveyRequest request) {
        Session session = requireOwnedSession(sessionId, requesterId);

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw ApiException.badRequest("error.common.titleRequired");
        }
        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            throw ApiException.badRequest("error.survey.atLeastOneQuestion");
        }

        Survey survey = Survey.builder()
                .session(session)
                .title(request.getTitle())
                .status(SurveyStatus.DRAFT)
                .build();
        survey = surveyRepository.save(survey);

        int index = 0;
        for (CreateSurveyQuestionRequest q : request.getQuestions()) {
            if (q.getPrompt() == null || q.getPrompt().isBlank()) {
                throw ApiException.badRequest("error.survey.questionPromptRequired");
            }
            if (q.getType() == null) {
                throw ApiException.badRequest("error.survey.questionTypeRequired");
            }
            String optionsCsv = null;
            if (q.getType() == SurveyQuestionType.SINGLE_CHOICE || q.getType() == SurveyQuestionType.DROPDOWN) {
                if (q.getOptions() == null || q.getOptions().size() < 2) {
                    throw ApiException.badRequest("error.survey.optionsRequiredForType", q.getType());
                }
                optionsCsv = String.join(",", q.getOptions());
            }

            SurveyQuestion question = SurveyQuestion.builder()
                    .survey(survey)
                    .prompt(q.getPrompt())
                    .type(q.getType())
                    .optionsCsv(optionsCsv)
                    .orderIndex(index++)
                    .build();
            surveyQuestionRepository.save(question);
        }

        log.info("ActionLog.create : Survey created successfully, surveyId={}, sessionId={}", survey.getId(), sessionId);
        return survey;
    }

    @Override
    public Survey setStatus(Long id, Long requesterId, SurveyStatus status) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.survey.notFound"));
        requireOwnedSession(survey.getSession().getId(), requesterId);

        if (status == null) {
            throw ApiException.badRequest("error.common.statusRequired");
        }
        SurveyStatus oldStatus = survey.getStatus();
        survey.setStatus(status);
        survey = surveyRepository.save(survey);
        log.info("ActionLog.setStatus : Survey status changed, surveyId={}, oldStatus={}, newStatus={}",
                survey.getId(), oldStatus, status);
        return survey;
    }

    @Override
    public List<SurveyQuestion> listQuestions(Long surveyId) {
        return surveyQuestionRepository.findBySurveyIdOrderByOrderIndexAsc(surveyId);
    }

    @Override
    public Survey getById(Long id) {
        return surveyRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.survey.notFound"));
    }

    @Override
    public List<Survey> listForSession(Long sessionId, Long requesterId) {
        requireOwnedSession(sessionId, requesterId);
        return surveyRepository.findBySessionId(sessionId);
    }

    @Override
    public Survey getActiveForSession(Long sessionId) {
        sessionAccessService.requireReadable(sessionId);
        return surveyRepository.findBySessionId(sessionId).stream()
                .filter(s -> s.getStatus() == SurveyStatus.ACTIVE)
                .findFirst()
                .orElse(null);
    }

    @Override
    public void submitResponse(Long surveyId, String voterToken, List<SubmitAnswerRequest> answers) {
        if (voterToken == null || voterToken.isBlank()) {
            throw ApiException.badRequest("error.common.voterTokenRequired");
        }
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> ApiException.notFound("error.survey.notFound"));
        sessionAccessService.requireInteractive(survey.getSession().getId());

        if (surveyResponseRepository.existsBySurveyIdAndVoterToken(surveyId, voterToken)) {
            throw ApiException.conflict("error.survey.alreadyResponded");
        }

        List<SurveyQuestion> questions = surveyQuestionRepository.findBySurveyIdOrderByOrderIndexAsc(surveyId);
        if (answers == null || answers.size() < questions.size()) {
            throw ApiException.badRequest("error.survey.answerRequiredForEveryQuestion");
        }

        Map<Long, String> answersByQuestionId = new LinkedHashMap<>();
        for (SubmitAnswerRequest answer : answers) {
            if (answer.getQuestionId() == null || answer.getValue() == null || answer.getValue().isBlank()) {
                throw ApiException.badRequest("error.survey.answerRequiresQuestionIdAndValue");
            }
            answersByQuestionId.put(answer.getQuestionId(), answer.getValue());
        }

        for (SurveyQuestion question : questions) {
            if (!answersByQuestionId.containsKey(question.getId())) {
                throw ApiException.badRequest("error.survey.missingAnswerForQuestion", question.getId());
            }
        }

        SurveyResponse response = SurveyResponse.builder()
                .survey(survey)
                .surveyId(surveyId)
                .voterToken(voterToken)
                .build();
        response = surveyResponseRepository.save(response);

        for (SurveyQuestion question : questions) {
            SurveyAnswer answer = SurveyAnswer.builder()
                    .response(response)
                    .question(question)
                    .value(answersByQuestionId.get(question.getId()))
                    .build();
            surveyAnswerRepository.save(answer);
        }

        log.info("ActionLog.submitResponse : Survey response submitted successfully, surveyId={}, responseId={}",
                surveyId, response.getId());
    }

    @Override
    public SurveyResultsDto getResults(Long surveyId, Long requesterId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> ApiException.notFound("error.survey.notFound"));
        requireOwnedSession(survey.getSession().getId(), requesterId);

        List<SurveyQuestion> questions = surveyQuestionRepository.findBySurveyIdOrderByOrderIndexAsc(surveyId);
        long responseCount = surveyResponseRepository.countBySurveyId(surveyId);

        List<SurveyQuestionResultDto> results = questions.stream()
                .map(this::buildQuestionResult)
                .toList();

        return new SurveyResultsDto(survey.getId(), survey.getTitle(), responseCount, results);
    }

    private SurveyQuestionResultDto buildQuestionResult(SurveyQuestion question) {
        List<SurveyAnswer> answers = surveyAnswerRepository.findByQuestionId(question.getId());

        Object aggregate;
        if (question.getType() == SurveyQuestionType.TEXT) {
            aggregate = answers.stream().map(SurveyAnswer::getValue).toList();
        } else {
            Map<String, Long> counts = new LinkedHashMap<>();
            for (SurveyAnswer answer : answers) {
                counts.merge(answer.getValue(), 1L, Long::sum);
            }
            aggregate = counts.entrySet().stream()
                    .map(e -> new OptionCount(e.getKey(), e.getValue()))
                    .toList();
        }

        return new SurveyQuestionResultDto(question.getId(), question.getPrompt(), question.getType(), aggregate);
    }

    private Session requireOwnedSession(Long sessionId, Long requesterId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> ApiException.notFound("error.session.notFound"));
        ownershipService.requireOwnerOrAdmin(session.getEvent(), requesterId);
        return session;
    }
}
