package com.auda.service.handler;

import com.auda.dao.entity.Event;
import com.auda.dao.entity.User;
import com.auda.dao.repository.EventRepository;
import com.auda.dao.repository.UserRepository;
import com.auda.exception.ApiException;
import com.auda.model.enums.EventStatus;
import com.auda.model.request.CreateEventRequest;
import com.auda.model.request.UpdateEventRequest;
import com.auda.service.OwnershipService;
import com.auda.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
    private final OwnershipService ownershipService;

    @Override
    public Event create(Long ownerId, CreateEventRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw ApiException.badRequest("error.event.nameRequired");
        }
        validateDateRange(request.getStartDate(), request.getEndDate());

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
        logIfOverQuota(owner);
        return event;
    }

    /** Both dates are required and the range must run forward, not backward. */
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw ApiException.badRequest("error.event.datesRequired");
        }
        if (endDate.isBefore(startDate)) {
            throw ApiException.badRequest("error.event.endBeforeStart");
        }
    }

    /**
     * The yearly event quota is informational, not a gate: the pricing page
     * promises extra events at a flat per-event rate rather than a forced
     * upgrade, and there is no payment integration yet to actually charge it.
     * Blocking creation here would strand a paying customer with no way
     * forward, so overage is logged for follow-up and surfaced to the owner
     * via GET /api/account/usage instead of rejected.
     */
    private void logIfOverQuota(User owner) {
        if (owner.getPlan().hasUnlimitedEvents()) {
            return;
        }
        long usedThisYear = countCreatedThisYear(owner.getId());
        if (usedThisYear > owner.getPlan().getEventsPerYear()) {
            log.warn("ActionLog.create : Owner exceeded yearly event quota, ownerId={}, plan={}, quota={}, used={}",
                    owner.getId(), owner.getPlan(), owner.getPlan().getEventsPerYear(), usedThisYear);
        }
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
    public Event getJoinableByJoinCode(String joinCode) {
        Event event = getByJoinCode(joinCode);

        if (event.getStatus() == EventStatus.DRAFT) {
            log.warn("ActionLog.getJoinableByJoinCode : Rejected join of a draft event, eventId={}", event.getId());
            throw ApiException.of(HttpStatus.FORBIDDEN, "EVENT_NOT_STARTED", "error.access.eventNotStarted");
        }

        return event;
    }

    @Override
    public void requireOwner(Event event, Long requesterId) {
        ownershipService.requireOwnerOrAdmin(event, requesterId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countCreatedThisYear(Long ownerId) {
        Instant yearStart = LocalDate.now().withDayOfYear(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return eventRepository.countByOwnerIdAndCreatedAtAfter(ownerId, yearStart);
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
