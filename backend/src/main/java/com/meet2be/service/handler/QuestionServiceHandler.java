package com.meet2be.service.handler;

import com.meet2be.dao.entity.Question;
import com.meet2be.dao.entity.Session;
import com.meet2be.dao.repository.QuestionRepository;
import com.meet2be.dao.repository.SessionRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.dto.QuestionDto;
import com.meet2be.model.dto.WsMessage;
import com.meet2be.model.enums.QuestionStatus;
import com.meet2be.model.enums.StageMode;
import com.meet2be.model.constants.WsMessageType;
import com.meet2be.model.request.SubmitQuestionRequest;
import com.meet2be.service.EventBroadcaster;
import com.meet2be.service.QuestionService;
import com.meet2be.service.SessionAccessService;
import com.meet2be.service.StageStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class QuestionServiceHandler implements QuestionService {

    private final QuestionRepository questionRepository;
    private final SessionRepository sessionRepository;
    private final EventBroadcaster eventBroadcaster;
    private final StageStateService stageStateService;
    private final SessionAccessService sessionAccessService;

    @Override
    public Question submit(Long sessionId, SubmitQuestionRequest request) {
        if (request.getBody() == null || request.getBody().isBlank()) {
            throw ApiException.badRequest("error.common.bodyRequired");
        }

        Session session = sessionAccessService.requireInteractive(sessionId);

        Question question = Question.builder()
                .session(session)
                .authorName(request.getAuthorName())
                .body(request.getBody())
                .status(QuestionStatus.PENDING)
                .build();

        question = questionRepository.save(question);
        log.info("ActionLog.submit : Question submitted successfully, questionId={}, sessionId={}",
                question.getId(), sessionId);

        eventBroadcaster.broadcastQuestions(sessionId,
                WsMessage.of(WsMessageType.QUESTION_CREATED, QuestionDto.from(question)));

        return question;
    }

    @Override
    public List<Question> listForSession(Long sessionId, Long requesterId) {
        Session session = requireOwnedSession(sessionId, requesterId);
        return questionRepository.findBySessionIdOrderByCreatedAtAsc(session.getId());
    }

    @Override
    public Question updateStatus(Long id, Long requesterId, QuestionStatus newStatus) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.question.notFound"));
        Long sessionId = question.getSession().getId();
        Long questionId = question.getId();
        requireOwnedSession(sessionId, requesterId);

        boolean onScreenChanged = (question.getStatus() == QuestionStatus.ON_SCREEN)
                != (newStatus == QuestionStatus.ON_SCREEN);

        if (newStatus == QuestionStatus.ON_SCREEN) {
            // Only one question may be ON_SCREEN per session at a time.
            questionRepository.findFirstBySessionIdAndStatus(sessionId, QuestionStatus.ON_SCREEN)
                    .filter(other -> !other.getId().equals(questionId))
                    .ifPresent(other -> {
                        other.setStatus(QuestionStatus.APPROVED);
                        questionRepository.save(other);
                    });

            // Sending a question to screen also switches the stage to QUESTION mode
            // so the stage screen actually renders it — there's no separate manual
            // control for this in the operator UI.
            Session session = question.getSession();
            if (session.getStageMode() != StageMode.QUESTION) {
                session.setStageMode(StageMode.QUESTION);
                sessionRepository.save(session);
            }
        }

        QuestionStatus oldStatus = question.getStatus();
        question.setStatus(newStatus);
        question = questionRepository.save(question);
        log.info("ActionLog.updateStatus : Question status changed, questionId={}, oldStatus={}, newStatus={}",
                question.getId(), oldStatus, newStatus);

        eventBroadcaster.broadcastQuestions(sessionId,
                WsMessage.of(WsMessageType.QUESTION_UPDATED, QuestionDto.from(question)));

        if (onScreenChanged) {
            stageStateService.broadcastStageState(sessionId);
        }

        return question;
    }

    private Session requireOwnedSession(Long sessionId, Long requesterId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> ApiException.notFound("error.session.notFound"));
        if (!session.getEvent().getOwner().getId().equals(requesterId)) {
            throw ApiException.forbidden("error.session.notOwner");
        }
        return session;
    }
}
