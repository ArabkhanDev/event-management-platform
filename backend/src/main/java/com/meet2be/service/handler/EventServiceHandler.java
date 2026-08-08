package com.meet2be.service.handler;

import com.meet2be.dao.entity.Event;
import com.meet2be.dao.entity.User;
import com.meet2be.dao.repository.EventRepository;
import com.meet2be.dao.repository.UserRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.enums.EventStatus;
import com.meet2be.model.request.CreateEventRequest;
import com.meet2be.model.request.UpdateEventRequest;
import com.meet2be.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EventServiceHandler implements EventService {

    private static final String JOIN_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int JOIN_CODE_LENGTH = 6;
    private static final int MAX_JOIN_CODE_ATTEMPTS = 20;

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    @Override
    public Event create(Long ownerId, CreateEventRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw ApiException.badRequest("error.event.nameRequired");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> ApiException.notFound("error.user.notFound"));

        Event event = Event.builder()
                .owner(owner)
                .name(request.getName())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .joinCode(generateUniqueJoinCode())
                .status(EventStatus.DRAFT)
                .build();

        event = eventRepository.save(event);
        log.info("ActionLog.create : Event created successfully, eventId={}, ownerId={}", event.getId(), ownerId);
        return event;
    }

    @Override
    public List<Event> listMine(Long ownerId) {
        return eventRepository.findByOwnerId(ownerId);
    }

    @Override
    public Event getById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.event.notFound"));
    }

    @Override
    public Event getOwnedById(Long id, Long requesterId) {
        Event event = getById(id);
        requireOwner(event, requesterId);
        return event;
    }

    @Override
    public Event update(Long id, Long requesterId, UpdateEventRequest request) {
        Event event = getOwnedById(id, requesterId);

        if (request.getName() != null) {
            if (request.getName().isBlank()) {
                throw ApiException.badRequest("error.event.nameBlank");
            }
            event.setName(request.getName());
        }
        if (request.getDescription() != null) {
            event.setDescription(request.getDescription());
        }
        if (request.getStatus() != null && request.getStatus() != event.getStatus()) {
            log.info("ActionLog.update : Event status changed, eventId={}, oldStatus={}, newStatus={}",
                    event.getId(), event.getStatus(), request.getStatus());
            event.setStatus(request.getStatus());
        }

        return eventRepository.save(event);
    }

    @Override
    public Event getByJoinCode(String joinCode) {
        return eventRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> ApiException.notFound("error.event.notFound"));
    }

    @Override
    public void requireOwner(Event event, Long requesterId) {
        if (!event.getOwner().getId().equals(requesterId)) {
            throw ApiException.forbidden("error.event.notOwner");
        }
    }

    private String generateUniqueJoinCode() {
        for (int i = 0; i < MAX_JOIN_CODE_ATTEMPTS; i++) {
            String candidate = randomJoinCode();
            if (!eventRepository.existsByJoinCode(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique join code");
    }

    private String randomJoinCode() {
        StringBuilder sb = new StringBuilder(JOIN_CODE_LENGTH);
        for (int i = 0; i < JOIN_CODE_LENGTH; i++) {
            sb.append(JOIN_CODE_ALPHABET.charAt(random.nextInt(JOIN_CODE_ALPHABET.length())));
        }
        return sb.toString();
    }
}
