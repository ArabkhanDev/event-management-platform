package com.meet2be.service.handler;

import com.meet2be.dao.entity.Event;
import com.meet2be.dao.entity.Session;
import com.meet2be.dao.repository.EventRepository;
import com.meet2be.dao.repository.SessionRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.enums.SessionStatus;
import com.meet2be.model.enums.StageMode;
import com.meet2be.model.request.CreateSessionRequest;
import com.meet2be.model.request.UpdateSessionRequest;
import com.meet2be.service.OwnershipService;
import com.meet2be.service.SessionService;
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
public class SessionServiceHandler implements SessionService {

    private final SessionRepository sessionRepository;
    private final EventRepository eventRepository;
    private final StageStateService stageStateService;
    private final OwnershipService ownershipService;

    @Override
    public Session create(Long eventId, Long requesterId, CreateSessionRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("error.event.notFound"));
        requireOwner(event, requesterId);

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw ApiException.badRequest("error.common.titleRequired");
        }

        Session session = Session.builder()
                .event(event)
                .title(request.getTitle())
                .speakerName(request.getSpeakerName())
                .hallName(request.getHallName())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(SessionStatus.SCHEDULED)
                .stageMode(StageMode.IDLE)
                .build();

        session = sessionRepository.save(session);
        log.info("ActionLog.create : Session created successfully, sessionId={}, eventId={}", session.getId(), eventId);
        return session;
    }

    @Override
    public List<Session> listForEvent(Long eventId) {
        return sessionRepository.findByEventId(eventId);
    }

    @Override
    public Session getById(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.session.notFound"));
    }

    // Fetch + ownership check must happen in one transactional call: getById()'s
    // repository call closes its persistence context as soon as it returns, so a
    // caller doing getById() then requireOwner(session.getEvent(), ...) as two
    // separate calls would hit a LazyInitializationException on the Event proxy.
    @Override
    public Session getOwned(Long id, Long requesterId) {
        Session session = getById(id);
        requireOwner(session.getEvent(), requesterId);
        return session;
    }

    @Override
    public Session update(Long id, Long requesterId, UpdateSessionRequest request) {
        Session session = getById(id);
        requireOwner(session.getEvent(), requesterId);

        boolean stageModeChanged = request.getStageMode() != null && request.getStageMode() != session.getStageMode();

        // Status drives what attendees are allowed to do, and it rides along in
        // the stage state — so ending a talk has to reach the phones already in
        // the room, not just the next visitor.
        boolean statusChanged = request.getStatus() != null && request.getStatus() != session.getStatus();

        if (request.getTitle() != null) {
            if (request.getTitle().isBlank()) {
                throw ApiException.badRequest("error.session.titleBlank");
            }
            session.setTitle(request.getTitle());
        }
        if (request.getSpeakerName() != null) {
            session.setSpeakerName(request.getSpeakerName());
        }
        if (request.getHallName() != null) {
            session.setHallName(request.getHallName());
        }
        if (request.getStartTime() != null) {
            session.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            session.setEndTime(request.getEndTime());
        }
        if (request.getStatus() != null) {
            session.setStatus(request.getStatus());
        }
        if (request.getStageMode() != null) {
            session.setStageMode(request.getStageMode());
        }

        session = sessionRepository.save(session);

        if (stageModeChanged) {
            log.info("ActionLog.update : Session stage mode changed, sessionId={}, stageMode={}",
                    session.getId(), session.getStageMode());
        }
        if (statusChanged) {
            log.info("ActionLog.update : Session status changed, sessionId={}, status={}",
                    session.getId(), session.getStatus());
        }
        if (stageModeChanged || statusChanged) {
            stageStateService.broadcastStageState(session.getId());
        }

        return session;
    }

    @Override
    public void requireOwner(Event event, Long requesterId) {
        ownershipService.requireOwnerOrAdmin(event, requesterId);
    }
}
