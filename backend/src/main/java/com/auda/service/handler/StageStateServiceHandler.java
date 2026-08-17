package com.auda.service.handler;

import com.auda.dao.entity.Poll;
import com.auda.dao.entity.PollOption;
import com.auda.dao.entity.Session;
import com.auda.dao.repository.PollOptionRepository;
import com.auda.dao.repository.PollRepository;
import com.auda.dao.repository.PollVoteRepository;
import com.auda.dao.repository.QuestionRepository;
import com.auda.dao.repository.SessionRepository;
import com.auda.exception.ApiException;
import com.auda.model.dto.PollDto;
import com.auda.model.dto.PollOptionDto;
import com.auda.model.dto.QuestionDto;
import com.auda.model.dto.SessionLeaderboardDto;
import com.auda.model.dto.StageStateDto;
import com.auda.model.dto.WsMessage;
import com.auda.model.enums.PollStatus;
import com.auda.model.enums.QuestionStatus;
import com.auda.model.enums.StageMode;
import com.auda.model.constants.WsMessageType;
import com.auda.service.EventBroadcaster;
import com.auda.service.LeaderboardService;
import com.auda.service.SessionAccessService;
import com.auda.service.StageStateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Builds and broadcasts the full "what's on stage right now" snapshot for a session:
 * the current stage mode, the ON_SCREEN question (if any), the ACTIVE poll (if any),
 * and the live leaderboard when a Score Game is running. Always pushes the full
 * snapshot rather than deltas, keeping the frontend simple.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class StageStateServiceHandler implements StageStateService {

    private final SessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PollVoteRepository pollVoteRepository;
    private final EventBroadcaster eventBroadcaster;
    private final LeaderboardService leaderboardService;
    private final SessionAccessService sessionAccessService;

    @Override
    public StageStateDto buildStageState(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> ApiException.notFound("error.session.notFound"));

        QuestionDto questionDto = questionRepository
                .findFirstBySessionIdAndStatus(sessionId, QuestionStatus.ON_SCREEN)
                .map(QuestionDto::from)
                .orElse(null);

        PollDto pollDto = pollRepository
                .findFirstBySessionIdAndStatus(sessionId, PollStatus.ACTIVE)
                .map(this::toPollDto)
                .orElse(null);

        SessionLeaderboardDto leaderboard = session.getStageMode() == StageMode.GAME
                ? leaderboardService.buildLeaderboard(sessionId)
                : null;

        return new StageStateDto(session.getStageMode(), questionDto, pollDto, leaderboard,
                sessionAccessService.resolve(session));
    }

    @Override
    @Transactional(readOnly = true)
    public StageStateDto getPublicStageState(Long sessionId) {
        sessionAccessService.requireReadable(sessionId);
        return buildStageState(sessionId);
    }

    @Override
    public void broadcastStageState(Long sessionId) {
        StageStateDto state = buildStageState(sessionId);
        eventBroadcaster.broadcastStage(sessionId, WsMessage.of(WsMessageType.STAGE_STATE, state));
    }

    private PollDto toPollDto(Poll poll) {
        var options = pollOptionRepository.findByPollIdOrderByOrderIndexAsc(poll.getId());
        var optionDtos = options.stream()
                .map(this::toPollOptionDto)
                .toList();
        return new PollDto(poll.getId(), poll.getSession().getId(), poll.getPrompt(), poll.getStatus(), optionDtos);
    }

    private PollOptionDto toPollOptionDto(PollOption option) {
        long votes = pollVoteRepository.countByOptionId(option.getId());
        return new PollOptionDto(option.getId(), option.getLabel(), votes);
    }
}
