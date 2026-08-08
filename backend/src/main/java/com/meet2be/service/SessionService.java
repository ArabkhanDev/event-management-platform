package com.meet2be.service;

import com.meet2be.dao.entity.Event;
import com.meet2be.dao.entity.Session;
import com.meet2be.model.request.CreateSessionRequest;
import com.meet2be.model.request.UpdateSessionRequest;

import java.util.List;

public interface SessionService {

    Session create(Long eventId, Long requesterId, CreateSessionRequest request);

    List<Session> listForEvent(Long eventId);

    Session getById(Long id);

    Session getOwned(Long id, Long requesterId);

    Session update(Long id, Long requesterId, UpdateSessionRequest request);

    void requireOwner(Event event, Long requesterId);
}
