package com.auda.service;

import com.auda.dao.entity.Event;
import com.auda.dao.entity.Session;
import com.auda.model.request.CreateSessionRequest;
import com.auda.model.request.UpdateSessionRequest;

import java.util.List;

public interface SessionService {

    Session create(Long eventId, Long requesterId, CreateSessionRequest request);

    List<Session> listForEvent(Long eventId);

    Session getById(Long id);

    Session getOwned(Long id, Long requesterId);

    Session update(Long id, Long requesterId, UpdateSessionRequest request);

    void requireOwner(Event event, Long requesterId);
}
