package com.meet2be.service.handler;

import com.meet2be.dao.entity.Poll;
import com.meet2be.dao.entity.PollOption;
import com.meet2be.dao.entity.Session;
import com.meet2be.dao.repository.PollOptionRepository;
import com.meet2be.dao.repository.PollRepository;
import com.meet2be.dao.repository.PollVoteRepository;
import com.meet2be.dao.repository.QuestionRepository;
import com.meet2be.dao.repository.SessionRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.dto.PollDto;
import com.meet2be.model.dto.PollOptionDto;
import com.meet2be.model.dto.QuestionDto;
import com.meet2be.model.dto.SessionLeaderboardDto;
import com.meet2be.model.dto.StageStateDto;
import com.meet2be.model.dto.WsMessage;
import com.meet2be.model.enums.PollStatus;
import com.meet2be.model.enums.QuestionStatus;
import com.meet2be.model.enums.StageMode;
import com.meet2be.model.constants.WsMessageType;
import com.meet2be.service.EventBroadcaster;
import com.meet2be.service.LeaderboardService;
import com.meet2be.service.StageStateService;
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

        return new StageStateDto(session.getStageMode(), questionDto, pollDto, leaderboard);
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
