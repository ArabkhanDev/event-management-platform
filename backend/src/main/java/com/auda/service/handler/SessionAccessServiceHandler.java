package com.auda.service.handler;

import com.auda.dao.entity.Session;
import com.auda.dao.repository.SessionRepository;
import com.auda.exception.ApiException;
import com.auda.model.dto.AuthenticatedUser;
import com.auda.model.enums.EventStatus;
import com.auda.model.enums.SessionAccessState;
import com.auda.service.OwnershipService;
import com.auda.service.SessionAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionAccessServiceHandler implements SessionAccessService {

    private static final String CODE_EVENT_NOT_STARTED = "EVENT_NOT_STARTED";
    private static final String CODE_SESSION_NOT_STARTED = "SESSION_NOT_STARTED";
    private static final String CODE_EVENT_ENDED = "EVENT_ENDED";
    private static final String CODE_SESSION_ENDED = "SESSION_ENDED";

    /**
     * Deliberately the repository rather than SessionService: StageStateService
     * is guarded by this class and is itself a dependency of SessionService,
     * so going through the service layer would close a constructor-injection
     * cycle and fail startup. Every sibling handler reaches for SessionRepository
     * the same way.
     */
    private final SessionRepository sessionRepository;
    private final OwnershipService ownershipService;

    @Override
    public SessionAccessState resolve(Session session) {
        EventStatus eventStatus = session.getEvent().getStatus();

        // The event is the outer gate: a draft exposes nothing regardless of how
        // its sessions are configured, and once it ends everything inside it is
        // over too, whatever a session still claims.
        if (eventStatus == EventStatus.DRAFT) {
            return SessionAccessState.NOT_STARTED;
        }
        if (eventStatus == EventStatus.ENDED) {
            return SessionAccessState.READ_ONLY;
        }

        return switch (session.getStatus()) {
            case SCHEDULED -> SessionAccessState.NOT_STARTED;
            case LIVE -> SessionAccessState.OPEN;
            case ENDED -> SessionAccessState.READ_ONLY;
        };
    }

    @Override
    @Transactional(readOnly = true)
    public SessionAccessState resolveBySessionId(Long sessionId) {
        return resolve(loadSession(sessionId));
    }

    @Override
    @Transactional(readOnly = true)
    public Session requireInteractive(Long sessionId) {
        Session session = loadSession(sessionId);
        SessionAccessState state = resolve(session);

        if (state != SessionAccessState.OPEN) {
            log.warn("ActionLog.requireInteractive : Rejected attendee write, sessionId={}, state={}",
                    sessionId, state);
            throw notAvailable(session, state);
        }

        return session;
    }

    @Override
    @Transactional(readOnly = true)
    public Session requireReadable(Long sessionId) {
        Session session = loadSession(sessionId);
        SessionAccessState state = resolve(session);

        // Organisers have to see their own session while preparing it, before it
        // is ever switched live. Reads only — writes stay closed to everyone,
        // since the operator's own controls go through the authenticated API.
        if (state == SessionAccessState.NOT_STARTED && !isOwner(session)) {
            log.warn("ActionLog.requireReadable : Rejected attendee read, sessionId={}", sessionId);
            throw notAvailable(session, state);
        }

        return session;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isCurrentUserOwner(Session session) {
        return isOwner(session);
    }

    private boolean isOwner(Session session) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            return false;
        }
        // Platform admins get the same pre-live read access as the owner, so a
        // support intervention can inspect a session that has not started.
        return session.getEvent().getOwner().getId().equals(user.getId())
                || ownershipService.isAdmin(user.getId());
    }

    private Session loadSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> ApiException.notFound("error.session.notFound"));
    }

    /**
     * Distinguishes event-level from session-level so the attendee app can say
     * "this event has not started" rather than the vaguer "not available".
     * The event always wins: if it is a draft or over, the session's own status
     * is not what the attendee needs to hear about.
     */
    private ApiException notAvailable(Session session, SessionAccessState state) {
        EventStatus eventStatus = session.getEvent().getStatus();

        if (state == SessionAccessState.NOT_STARTED) {
            return eventStatus == EventStatus.DRAFT
                    ? ApiException.of(FORBIDDEN, CODE_EVENT_NOT_STARTED, "error.access.eventNotStarted")
                    : ApiException.of(FORBIDDEN, CODE_SESSION_NOT_STARTED, "error.access.sessionNotStarted");
        }

        return eventStatus == EventStatus.ENDED
                ? ApiException.of(CONFLICT, CODE_EVENT_ENDED, "error.access.eventEnded")
                : ApiException.of(CONFLICT, CODE_SESSION_ENDED, "error.access.sessionEnded");
    }
}
