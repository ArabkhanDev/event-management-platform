package com.meet2be.service;

/**
 * Enforces the attendee-per-event cap that comes with the owner's {@code
 * PlanTier}. See {@link com.meet2be.model.enums.PlanTier} for the limits and
 * {@link com.meet2be.dao.entity.EventParticipant} for why counting needs its
 * own table rather than reusing attendee email capture.
 */
public interface EventCapacityService {

    /**
     * Registers {@code voterToken} as having joined the event, unless it
     * already has (a re-join must never fail once someone is in). Throws when
     * a genuinely new join would exceed the owner's plan cap.
     *
     * <p>Takes an id rather than an {@code Event} on purpose: the event this
     * guards is loaded by a different service call earlier in the request
     * (open-in-view is off), so an entity handed in here would carry a lazy
     * {@code owner} association with no session left to resolve it. Re-fetching
     * by id keeps the whole read inside this method's own transaction.
     *
     * <p>A null or blank token is treated as untrackable rather than rejected:
     * older or non-browser clients without one should not be locked out, at
     * the cost of that visit not counting against capacity.
     */
    void registerJoin(Long eventId, String voterToken);

    long countParticipants(Long eventId);
}
