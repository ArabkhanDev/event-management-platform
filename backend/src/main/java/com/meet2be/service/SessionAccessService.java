package com.meet2be.service;

import com.meet2be.dao.entity.Session;
import com.meet2be.model.enums.SessionAccessState;

/**
 * Single place where "may an attendee touch this session?" is decided.
 *
 * <p>Every {@code /api/public/**} entry point routes through here, because the
 * join code is the only credential an attendee has — hiding controls in the UI
 * would leave the API itself open to anyone who has the code.
 */
public interface SessionAccessService {

    SessionAccessState resolve(Session session);

    SessionAccessState resolveBySessionId(Long sessionId);

    /**
     * Guards writes — asking a question, voting, answering, responding.
     * Passes only while both the event and the session are live.
     */
    Session requireInteractive(Long sessionId);

    /**
     * Guards reads — results, leaderboards, slides, stage state.
     * Passes once the session has started, and keeps passing after it ends.
     */
    Session requireReadable(Long sessionId);
}
