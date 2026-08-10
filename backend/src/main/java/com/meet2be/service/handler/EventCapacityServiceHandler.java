package com.meet2be.service.handler;

import com.meet2be.dao.entity.Event;
import com.meet2be.dao.entity.EventParticipant;
import com.meet2be.dao.repository.EventParticipantRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.enums.PlanTier;
import com.meet2be.service.EventCapacityService;
import com.meet2be.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventCapacityServiceHandler implements EventCapacityService {

    private final EventParticipantRepository participantRepository;
    private final EventService eventService;

    @Override
    @Transactional
    public void registerJoin(Long eventId, String voterToken) {
        if (voterToken == null || voterToken.isBlank()) {
            return;
        }

        // Re-joining must always succeed — the cap only ever blocks a name that
        // has never been seen on this event before.
        if (participantRepository.existsByEventIdAndVoterToken(eventId, voterToken)) {
            return;
        }

        // Loaded here, inside this method's own transaction, rather than reused
        // from the caller — see the interface javadoc for why.
        Event event = eventService.getById(eventId);
        PlanTier plan = event.getOwner().getPlan();

        if (!plan.hasUnlimitedAttendees()) {
            long current = participantRepository.countByEventId(eventId);
            if (current >= plan.getAttendeesPerEvent()) {
                log.info("ActionLog.registerJoin : Rejected join over the attendee cap, eventId={}, plan={}, cap={}",
                        eventId, plan, plan.getAttendeesPerEvent());
                throw ApiException.of(HttpStatus.FORBIDDEN, "EVENT_FULL", "error.access.eventFull");
            }
        }

        participantRepository.save(EventParticipant.builder()
                .event(event)
                .voterToken(voterToken)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public long countParticipants(Long eventId) {
        return participantRepository.countByEventId(eventId);
    }
}
