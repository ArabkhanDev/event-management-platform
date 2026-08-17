package com.auda.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.auda.dao.entity.Session;

public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByEventId(Long eventId);

    long countByEventId(Long eventId);
}
