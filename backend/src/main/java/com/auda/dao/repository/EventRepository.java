package com.auda.dao.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import com.auda.dao.entity.Event;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByOwnerId(Long ownerId);

    Optional<Event> findByJoinCode(String joinCode);

    boolean existsByJoinCode(String joinCode);

    long countByOwnerIdAndCreatedAtAfter(Long ownerId, Instant createdAfter);

    long countByOwnerId(Long ownerId);

    Page<Event> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
