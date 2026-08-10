package com.meet2be.service;

import com.meet2be.dao.entity.Event;
import com.meet2be.dao.entity.User;

/**
 * The single place that answers "may this requester act on this event?".
 *
 * <p>Every handler used to inline the same {@code event.getOwner().getId()
 * .equals(requesterId)} check, which meant platform admins would have had to
 * be special-cased in ten separate spots — and any one of them missed would be
 * a silent hole. Routing all of them through here means the admin override is
 * defined once.
 */
public interface OwnershipService {

    /**
     * Passes when the requester owns the event, or is a platform ADMIN acting
     * on someone else's event (logged, since that is a support intervention
     * rather than ordinary use).
     */
    void requireOwnerOrAdmin(Event event, Long requesterId);

    /** Guards the admin-only API surface. */
    User requireAdmin(Long requesterId);

    boolean isAdmin(Long userId);
}
