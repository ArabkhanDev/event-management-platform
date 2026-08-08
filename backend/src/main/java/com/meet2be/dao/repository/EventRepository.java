package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import com.meet2be.dao.entity.Event;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByOwnerId(Long ownerId);

    Optional<Event> findByJoinCode(String joinCode);

    boolean existsByJoinCode(String joinCode);
}
