package com.meet2be.dao.repository;

import com.meet2be.dao.entity.EventParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {

    boolean existsByEventIdAndVoterToken(Long eventId, String voterToken);

    long countByEventId(Long eventId);
}
