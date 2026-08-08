package com.meet2be.service.handler;

import com.meet2be.dao.entity.GameAnswer;
import com.meet2be.dao.entity.GameOption;
import com.meet2be.dao.entity.GameQuestion;
import com.meet2be.dao.entity.Session;
import com.meet2be.dao.repository.GameAnswerRepository;
import com.meet2be.dao.repository.GameOptionRepository;
import com.meet2be.dao.repository.GameQuestionRepository;
import com.meet2be.dao.repository.SessionRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.dto.GameOptionDto;
import com.meet2be.model.dto.GameQuestionDto;
import com.meet2be.model.dto.SessionLeaderboardDto;
import com.meet2be.model.dto.WsMessage;
import com.meet2be.model.enums.GameStatus;
import com.meet2be.model.enums.StageMode;
import com.meet2be.model.constants.WsMessageType;
import com.meet2be.model.request.CreateGameQuestionRequest;
import com.meet2be.service.EventBroadcaster;
import com.meet2be.service.GameService;
import com.meet2be.service.LeaderboardService;
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
public class GameServiceHandler implements GameService {

    private final GameQuestionRepository gameQuestionRepository;
    private final GameOptionRepository gameOptionRepository;
    private final GameAnswerRepository gameAnswerRepository;
    private final SessionRepository sessionRepository;
    private final EventBroadcaster eventBroadcaster;
    private final StageStateService stageStateService;
    private final LeaderboardService leaderboardService;

    @Override
    public GameQuestion create(Long sessionId, Long requesterId, CreateGameQuestionRequest request) {
        Session session = requireOwnedSession(sessionId, requesterId);

        if (request.getPrompt() == null || request.getPrompt().isBlank()) {
            throw ApiException.badRequest("error.common.promptRequired");
        }
        if (request.getOptions() == null || request.getOptions().size() < 2) {
            throw ApiException.badRequest("error.common.atLeastTwoOptions");
        }
        long correctCount = request.getOptions().stream().filter(o -> o != null && o.isCorrect()).count();
        if (correctCount != 1) {
            throw ApiException.badRequest("error.game.exactlyOneCorrect");
        }
        int points = request.getPoints() == null || request.getPoints() <= 0 ? 100 : request.getPoints();

        GameQuestion question = GameQuestion.builder()
                .session(session)
                .prompt(request.getPrompt())
                .status(GameStatus.DRAFT)
                .points(points)
                .build();
        question = gameQuestionRepository.save(question);

        saveOptions(question, request);

        log.info("ActionLog.create : Game question created successfully, questionId={}, sessionId={}",
                question.getId(), sessionId);
        return question;
    }

    private void saveOptions(GameQuestion question, CreateGameQuestionRequest request) {
        int index = 0;
        for (var opt : request.getOptions()) {
            if (opt.getLabel() == null || opt.getLabel().isBlank()) {
                throw ApiException.badRequest("error.common.optionLabelsBlank");
            }
            GameOption option = GameOption.builder()
                    .question(question)
                    .label(opt.getLabel())
                    .correct(opt.isCorrect())
                    .orderIndex(index++)
                    .build();
            gameOptionRepository.save(option);
        }
    }

    @Override
    public GameQuestion setStatus(Long id, Long requesterId, GameStatus newStatus) {
        GameQuestion question = gameQuestionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.game.notFound"));
        Long sessionId = question.getSession().getId();
        Long questionId = question.getId();
        requireOwnedSession(sessionId, requesterId);

        boolean activeChanged = (question.getStatus() == GameStatus.ACTIVE) != (newStatus == GameStatus.ACTIVE);

        if (newStatus == GameStatus.ACTIVE) {
            activateExclusively(sessionId, questionId);
            switchStageToGame(question.getSession());
        }

        GameStatus oldStatus = question.getStatus();
        question.setStatus(newStatus);
        question = gameQuestionRepository.save(question);
        log.info("ActionLog.setStatus : Game question status changed, questionId={}, oldStatus={}, newStatus={}",
                question.getId(), oldStatus, newStatus);

        broadcastQuestion(sessionId, question);

        if (activeChanged) {
            stageStateService.broadcastStageState(sessionId);
        }

        return question;
    }

    private void activateExclusively(Long sessionId, Long questionId) {
        // Only one game question may be ACTIVE per session at a time.
        gameQuestionRepository.findFirstBySessionIdAndStatus(sessionId, GameStatus.ACTIVE)
                .filter(other -> !other.getId().equals(questionId))
                .ifPresent(other -> {
                    other.setStatus(GameStatus.CLOSED);
                    gameQuestionRepository.save(other);
                });
    }

    private void switchStageToGame(Session session) {
        if (session.getStageMode() != StageMode.GAME) {
            session.setStageMode(StageMode.GAME);
            sessionRepository.save(session);
        }
    }

    @Override
    public GameQuestionDto answer(Long questionId, String voterToken, Long optionId, String playerName) {
        if (voterToken == null || voterToken.isBlank()) {
            throw ApiException.badRequest("error.common.voterTokenRequired");
        }
        if (optionId == null) {
            throw ApiException.badRequest("error.common.optionIdRequired");
        }

        GameQuestion question = gameQuestionRepository.findById(questionId)
                .orElseThrow(() -> ApiException.notFound("error.game.notFound"));

        GameOption option = gameOptionRepository.findById(optionId)
                .orElseThrow(() -> ApiException.notFound("error.game.optionNotFound"));
        if (!option.getQuestion().getId().equals(questionId)) {
            throw ApiException.badRequest("error.game.optionMismatch");
        }

        if (gameAnswerRepository.existsByQuestionIdAndVoterToken(questionId, voterToken)) {
            throw ApiException.conflict("error.game.alreadyAnswered");
        }

        Long sessionId = question.getSession().getId();
        GameAnswer answer = GameAnswer.builder()
                .option(option)
                .questionId(questionId)
                .sessionId(sessionId)
                .voterToken(voterToken)
                .playerName(playerName)
                .correct(option.isCorrect())
                .pointsAwarded(option.isCorrect() ? question.getPoints() : 0)
                .build();
        gameAnswerRepository.save(answer);
        log.info("ActionLog.answer : Answer submitted successfully, questionId={}, correct={}, pointsAwarded={}",
                questionId, answer.isCorrect(), answer.getPointsAwarded());

        GameQuestionDto dto = broadcastQuestion(sessionId, question);
        broadcastLeaderboard(sessionId);

        if (question.getStatus() == GameStatus.ACTIVE) {
            stageStateService.broadcastStageState(sessionId);
        }

        return dto;
    }

    @Override
    public GameQuestionDto getResults(Long questionId) {
        GameQuestion question = gameQuestionRepository.findById(questionId)
                .orElseThrow(() -> ApiException.notFound("error.game.notFound"));
        return toDto(question);
    }

    @Override
    public List<GameQuestionDto> listForSession(Long sessionId, Long requesterId) {
        requireOwnedSession(sessionId, requesterId);
        return gameQuestionRepository.findBySessionId(sessionId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public SessionLeaderboardDto getLeaderboard(Long sessionId) {
        return leaderboardService.buildLeaderboard(sessionId);
    }

    @Override
    public GameQuestionDto getActiveForSession(Long sessionId) {
        return gameQuestionRepository.findFirstBySessionIdAndStatus(sessionId, GameStatus.ACTIVE)
                .map(this::toDto)
                .orElse(null);
    }

    private GameQuestionDto broadcastQuestion(Long sessionId, GameQuestion question) {
        GameQuestionDto dto = toDto(question);
        eventBroadcaster.broadcastGame(sessionId, WsMessage.of(WsMessageType.GAME_QUESTION_UPDATED, dto));
        return dto;
    }

    private void broadcastLeaderboard(Long sessionId) {
        SessionLeaderboardDto leaderboard = leaderboardService.buildLeaderboard(sessionId);
        eventBroadcaster.broadcastGame(sessionId, WsMessage.of(WsMessageType.LEADERBOARD_UPDATED, leaderboard));
    }

    private GameQuestionDto toDto(GameQuestion question) {
        List<GameOptionDto> options = gameOptionRepository.findByQuestionIdOrderByOrderIndexAsc(question.getId()).stream()
                .map(option -> new GameOptionDto(option.getId(), option.getLabel(),
                        gameAnswerRepository.countByOptionId(option.getId()), option.isCorrect()))
                .toList();
        return new GameQuestionDto(question.getId(), question.getSession().getId(), question.getPrompt(),
                question.getStatus(), question.getPoints(), options);
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
