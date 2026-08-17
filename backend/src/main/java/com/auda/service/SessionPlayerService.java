package com.auda.service;

import com.auda.model.dto.SessionPlayerDto;

import java.util.Map;

/**
 * Owns the display name an attendee plays the score game under.
 *
 * <p>Names are unique within a session and claimed up front rather than sent
 * with each answer, so that a leaderboard row always identifies one person.
 */
public interface SessionPlayerService {

    /**
     * Reserves {@code name} for this voter token in this session.
     *
     * <p>Idempotent for the same token — re-claiming a name you already hold
     * succeeds, which is what lets the attendee app re-validate a name it
     * remembered from a previous session on every visit. Claiming a different
     * name replaces the previous one.
     *
     * @throws com.auda.exception.ApiException 409 when another token in the
     *         session already holds the name, 400 when the name is unusable.
     */
    SessionPlayerDto claim(Long sessionId, String voterToken, String name);

    /** The claimed name, or null when this token has not claimed one yet. */
    String findClaimedName(Long sessionId, String voterToken);

    /** Claimed names in the session, keyed by voter token — for the leaderboard. */
    Map<String, String> namesBySession(Long sessionId);
}
