package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import com.meet2be.dao.entity.EventAttendee;
import com.meet2be.model.enums.AttendeeTag;

public interface EventAttendeeRepository extends JpaRepository<EventAttendee, Long> {
    Optional<EventAttendee> findByEventIdAndVoterToken(Long eventId, String voterToken);

    long countByEventIdAndEmailIsNotNull(Long eventId);

    List<EventAttendee> findByEventIdAndEmailIsNotNull(Long eventId);

    long countByEventIdAndEmailIsNotNullAndTagIn(Long eventId, Collection<AttendeeTag> tags);

    List<EventAttendee> findByEventIdAndEmailIsNotNullAndTagIn(Long eventId, Collection<AttendeeTag> tags);

    List<EventAttendee> findByEventIdOrderByCreatedAtDesc(Long eventId);
}
