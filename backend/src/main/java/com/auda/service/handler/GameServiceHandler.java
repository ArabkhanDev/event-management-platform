package com.auda.service.handler;

import com.auda.dao.entity.GameAnswer;
import com.auda.dao.entity.GameOption;
import com.auda.dao.entity.GameQuestion;
import com.auda.dao.entity.Session;
import com.auda.dao.repository.GameAnswerRepository;
import com.auda.dao.repository.GameOptionRepository;
import com.auda.dao.repository.GameQuestionRepository;
import com.auda.dao.repository.SessionRepository;
import com.auda.exception.ApiException;
import com.auda.model.dto.DeletedGameQuestionDto;
import com.auda.model.dto.GameOptionDto;
import com.auda.model.dto.GameQuestionDto;
import com.auda.model.dto.SessionLeaderboardDto;
import com.auda.model.dto.WsMessage;
import com.auda.model.enums.GameStatus;
import com.auda.model.enums.StageMode;
import com.auda.model.constants.WsMessageType;
import com.auda.model.request.CreateGameQuestionRequest;
import com.auda.service.OwnershipService;
import com.auda.service.EventBroadcaster;
import com.auda.service.GameService;
import com.auda.service.LeaderboardService;
import com.auda.service.SessionAccessService;
import com.auda.service.SessionPlayerService;
import com.auda.service.StageStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GameServiceHandler implements GameService {

    /** Stable code telling the attendee app to re-show its name gate. */
    public static final String PLAYER_NAME_REQUIRED_CODE = "PLAYER_NAME_REQUIRED";

    /** Distinguishes "this question is not live" from "you already answered". */
    public static final String NOT_ACCEPTING_ANSWERS_CODE = "GAME_NOT_ACCEPTING_ANSWERS";

    private final GameQuestionRepository gameQuestionRepository;
    private final GameOptionRepository gameOptionRepository;
    private final GameAnswerRepository gameAnswerRepository;
    private final SessionRepository sessionRepository;
    private final EventBroadcaster eventBroadcaster;
    private final StageStateService stageStateService;
    private final LeaderboardService leaderboardService;
    private final SessionAccessService sessionAccessService;
    private final OwnershipService ownershipService;
    private final SessionPlayerService sessionPlayerService;

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

        // Every transition moves the standings, because only CLOSED questions
        // contribute points: closing pays out the answers already given, and
        // reopening takes those same points back off the board.
        broadcastLeaderboard(sessionId);

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
        sessionAccessService.requireInteractive(question.getSession().getId());

        // The attendee app only offers the options while a question is live,
        // but the endpoint is public: without this, a hand-made request could
        // answer a question that has already been revealed and drop points
        // straight into standings the room has just seen.
        if (question.getStatus() != GameStatus.ACTIVE) {
            throw ApiException.of(HttpStatus.CONFLICT, NOT_ACCEPTING_ANSWERS_CODE, "error.game.notAcceptingAnswers");
        }

        GameOption option = gameOptionRepository.findById(optionId)
                .orElseThrow(() -> ApiException.notFound("error.game.optionNotFound"));
        if (!option.getQuestion().getId().equals(questionId)) {
            throw ApiException.badRequest("error.game.optionMismatch");
        }

        if (gameAnswerRepository.existsByQuestionIdAndVoterToken(questionId, voterToken)) {
            throw ApiException.conflict("error.game.alreadyAnswered");
        }

        Long sessionId = question.getSession().getId();
        String claimedName = resolvePlayerName(sessionId, voterToken, playerName);
        GameAnswer answer = GameAnswer.builder()
                .option(option)
                .questionId(questionId)
                .sessionId(sessionId)
                .voterToken(voterToken)
                .playerName(claimedName)
                .correct(option.isCorrect())
                .pointsAwarded(option.isCorrect() ? question.getPoints() : 0)
                .build();
        gameAnswerRepository.save(answer);
        log.info("ActionLog.answer : Answer submitted successfully, questionId={}, correct={}, pointsAwarded={}",
                questionId, answer.isCorrect(), answer.getPointsAwarded());

        // Deliberately no leaderboard broadcast: the question is still live, so
        // these points do not count yet. setStatus pays them out at the reveal.
        GameQuestionDto dto = broadcastQuestion(sessionId, question);
        stageStateService.broadcastStageState(sessionId);

        return dto;
    }

    @Override
    public void delete(Long id, Long requesterId) {
        GameQuestion question = gameQuestionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.game.notFound"));
        Long sessionId = question.getSession().getId();
        requireOwnedSession(sessionId, requesterId);

        boolean wasActive = question.getStatus() == GameStatus.ACTIVE;

        // Answers first: each one points at both the question and one of its
        // options, so removing the options underneath them would trip the
        // foreign key.
        gameAnswerRepository.deleteByQuestionId(id);
        gameOptionRepository.deleteByQuestionId(id);
        gameQuestionRepository.delete(question);

        log.info("ActionLog.delete : Game question deleted successfully, questionId={}, sessionId={}", id, sessionId);

        eventBroadcaster.broadcastGame(sessionId,
                WsMessage.of(WsMessageType.GAME_QUESTION_DELETED, new DeletedGameQuestionDto(id, sessionId)));
        // Its answers were carrying points, so every standing behind it moved.
        broadcastLeaderboard(sessionId);

        if (wasActive) {
            stageStateService.broadcastStageState(sessionId);
        }
    }

    /**
     * Every answer is attributed to a claimed name — a leaderboard of
     * "Player A3F9" tells the room nothing about who is winning.
     *
     * <p>The name normally arrives via the claim endpoint before the attendee
     * ever sees a question, so this is a lookup. A name on the request itself
     * is still honoured (older clients sent it per-answer, and it lets a player
     * whose stored name was cleared recover in one call), and a token with
     * neither gets a coded 400 the attendee app answers by re-showing its name
     * gate rather than a dead-end error.
     */
    private String resolvePlayerName(Long sessionId, String voterToken, String requestedName) {
        if (requestedName != null && !requestedName.isBlank()) {
            return sessionPlayerService.claim(sessionId, voterToken, requestedName).getDisplayName();
        }
        String claimed = sessionPlayerService.findClaimedName(sessionId, voterToken);
        if (claimed == null) {
            throw ApiException.of(HttpStatus.BAD_REQUEST, PLAYER_NAME_REQUIRED_CODE, "error.game.playerNameRequired");
        }
        return claimed;
    }

    @Override
    public GameQuestionDto getResults(Long questionId) {
        GameQuestion question = gameQuestionRepository.findById(questionId)
                .orElseThrow(() -> ApiException.notFound("error.game.notFound"));
        sessionAccessService.requireReadable(question.getSession().getId());
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
        sessionAccessService.requireReadable(sessionId);
        return leaderboardService.buildLeaderboard(sessionId);
    }

    @Override
    public GameQuestionDto getActiveForSession(Long sessionId) {
        sessionAccessService.requireReadable(sessionId);
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
        ownershipService.requireOwnerOrAdmin(session.getEvent(), requesterId);
        return session;
    }
}
