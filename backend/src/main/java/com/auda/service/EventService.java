package com.auda.service;

import com.auda.dao.entity.Event;
import com.auda.model.request.CreateEventRequest;
import com.auda.model.request.UpdateEventRequest;

import java.util.List;

public interface EventService {

    Event create(Long ownerId, CreateEventRequest request);

    List<Event> listMine(Long ownerId);

    Event getById(Long id);

    Event getOwnedById(Long id, Long requesterId);

    Event update(Long id, Long requesterId, UpdateEventRequest request);

    Event getByJoinCode(String joinCode);

    /**
     * Join-code lookup for attendees. Rejects events that are still drafts, so
     * a code shared or guessed early exposes nothing until the organiser goes
     * live. Ended events resolve, since results stay viewable afterwards.
     */
    Event getJoinableByJoinCode(String joinCode);

    void requireOwner(Event event, Long requesterId);

    /** Count of events this owner has created since the start of the current calendar year. */
    long countCreatedThisYear(Long ownerId);
}
