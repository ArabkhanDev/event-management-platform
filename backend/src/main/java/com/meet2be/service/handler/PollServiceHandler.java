package com.meet2be.service.handler;

import com.meet2be.dao.entity.Poll;
import com.meet2be.dao.entity.PollOption;
import com.meet2be.dao.entity.PollVote;
import com.meet2be.dao.entity.Session;
import com.meet2be.dao.repository.PollOptionRepository;
import com.meet2be.dao.repository.PollRepository;
import com.meet2be.dao.repository.PollVoteRepository;
import com.meet2be.dao.repository.SessionRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.dto.PollDto;
import com.meet2be.model.dto.PollOptionDto;
import com.meet2be.model.dto.WsMessage;
import com.meet2be.model.enums.PollStatus;
import com.meet2be.model.enums.StageMode;
import com.meet2be.model.constants.WsMessageType;
import com.meet2be.model.request.CreatePollRequest;
import com.meet2be.service.EventBroadcaster;
import com.meet2be.service.PollService;
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
public class PollServiceHandler implements PollService {

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PollVoteRepository pollVoteRepository;
    private final SessionRepository sessionRepository;
    private final EventBroadcaster eventBroadcaster;
    private final StageStateService stageStateService;
    private final SessionAccessService sessionAccessService;

    @Override
    public Poll create(Long sessionId, Long requesterId, CreatePollRequest request) {
        Session session = requireOwnedSession(sessionId, requesterId);

        if (request.getPrompt() == null || request.getPrompt().isBlank()) {
            throw ApiException.badRequest("error.common.promptRequired");
        }
        if (request.getOptions() == null || request.getOptions().size() < 2) {
            throw ApiException.badRequest("error.common.atLeastTwoOptions");
        }

        Poll poll = Poll.builder()
                .session(session)
                .prompt(request.getPrompt())
                .status(PollStatus.DRAFT)
                .build();
        poll = pollRepository.save(poll);

        int index = 0;
        for (String label : request.getOptions()) {
            if (label == null || label.isBlank()) {
                throw ApiException.badRequest("error.common.optionLabelsBlank");
            }
            PollOption option = PollOption.builder()
                    .poll(poll)
                    .label(label)
                    .orderIndex(index++)
                    .build();
            pollOptionRepository.save(option);
        }

        log.info("ActionLog.create : Poll created successfully, pollId={}, sessionId={}", poll.getId(), sessionId);
        return poll;
    }

    @Override
    public Poll setStatus(Long id, Long requesterId, PollStatus newStatus) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.poll.notFound"));
        Long sessionId = poll.getSession().getId();
        Long pollId = poll.getId();
        requireOwnedSession(sessionId, requesterId);

        boolean activeChanged = (poll.getStatus() == PollStatus.ACTIVE) != (newStatus == PollStatus.ACTIVE);

        if (newStatus == PollStatus.ACTIVE) {
            // Only one poll may be ACTIVE per session at a time.
            pollRepository.findFirstBySessionIdAndStatus(sessionId, PollStatus.ACTIVE)
                    .filter(other -> !other.getId().equals(pollId))
                    .ifPresent(other -> {
                        other.setStatus(PollStatus.CLOSED);
                        pollRepository.save(other);
                    });

            // Activating a poll also switches the stage to POLL mode so the stage
            // screen actually renders it — there's no separate manual control for
            // this in the operator UI.
            Session session = poll.getSession();
            if (session.getStageMode() != StageMode.POLL) {
                session.setStageMode(StageMode.POLL);
                sessionRepository.save(session);
            }
        }

        PollStatus oldStatus = poll.getStatus();
        poll.setStatus(newStatus);
        poll = pollRepository.save(poll);
        log.info("ActionLog.setStatus : Poll status changed, pollId={}, oldStatus={}, newStatus={}",
                poll.getId(), oldStatus, newStatus);

        eventBroadcaster.broadcastPolls(sessionId, WsMessage.of(WsMessageType.POLL_UPDATED, toDto(poll)));

        if (activeChanged) {
            stageStateService.broadcastStageState(sessionId);
        }

        return poll;
    }

    @Override
    public PollDto vote(Long pollId, String voterToken, Long optionId) {
        if (voterToken == null || voterToken.isBlank()) {
            throw ApiException.badRequest("error.common.voterTokenRequired");
        }
        if (optionId == null) {
            throw ApiException.badRequest("error.common.optionIdRequired");
        }

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> ApiException.notFound("error.poll.notFound"));
        sessionAccessService.requireInteractive(poll.getSession().getId());

        PollOption option = pollOptionRepository.findById(optionId)
                .orElseThrow(() -> ApiException.notFound("error.poll.optionNotFound"));
        if (!option.getPoll().getId().equals(pollId)) {
            throw ApiException.badRequest("error.poll.optionMismatch");
        }

        if (pollVoteRepository.existsByPollIdAndVoterToken(pollId, voterToken)) {
            throw ApiException.conflict("error.poll.alreadyVoted");
        }

        PollVote vote = PollVote.builder()
                .option(option)
                .pollId(pollId)
                .voterToken(voterToken)
                .build();
        pollVoteRepository.save(vote);
        log.info("ActionLog.vote : Vote cast successfully, pollId={}, optionId={}", pollId, optionId);

        Long sessionId = poll.getSession().getId();
        PollDto dto = toDto(poll);
        eventBroadcaster.broadcastPolls(sessionId, WsMessage.of(WsMessageType.POLL_UPDATED, dto));

        if (poll.getStatus() == PollStatus.ACTIVE) {
            stageStateService.broadcastStageState(sessionId);
        }

        return dto;
    }

    @Override
    public PollDto getResults(Long pollId) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> ApiException.notFound("error.poll.notFound"));
        sessionAccessService.requireReadable(poll.getSession().getId());
        return toDto(poll);
    }

    @Override
    public List<PollDto> listForSession(Long sessionId, Long requesterId) {
        requireOwnedSession(sessionId, requesterId);
        return pollRepository.findBySessionId(sessionId).stream()
                .map(this::toDto)
                .toList();
    }

    private PollDto toDto(Poll poll) {
        List<PollOptionDto> options = pollOptionRepository.findByPollIdOrderByOrderIndexAsc(poll.getId()).stream()
                .map(option -> new PollOptionDto(option.getId(), option.getLabel(),
                        pollVoteRepository.countByOptionId(option.getId())))
                .toList();
        return new PollDto(poll.getId(), poll.getSession().getId(), poll.getPrompt(), poll.getStatus(), options);
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
