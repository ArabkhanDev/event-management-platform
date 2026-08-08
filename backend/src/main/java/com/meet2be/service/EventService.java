package com.meet2be.service;

import com.meet2be.dao.entity.Event;
import com.meet2be.model.request.CreateEventRequest;
import com.meet2be.model.request.UpdateEventRequest;

import java.util.List;

public interface EventService {

    Event create(Long ownerId, CreateEventRequest request);

    List<Event> listMine(Long ownerId);

    Event getById(Long id);

    Event getOwnedById(Long id, Long requesterId);

    Event update(Long id, Long requesterId, UpdateEventRequest request);

    Event getByJoinCode(String joinCode);

    void requireOwner(Event event, Long requesterId);
}
