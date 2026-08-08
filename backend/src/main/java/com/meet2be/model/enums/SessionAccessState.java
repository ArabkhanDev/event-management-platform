package com.meet2be.model.enums;

/**
 * What an attendee holding a join code is allowed to do with a session,
 * derived from the event status combined with the session status.
 */
public enum SessionAccessState {

    /** Nothing is exposed yet — the event is a draft, or the talk has not been started. */
    NOT_STARTED,

    /** Live: attendees may read and submit questions, votes, answers and responses. */
    OPEN,

    /** Over: results, leaderboards and slides stay readable, but nothing new is accepted. */
    READ_ONLY
}
