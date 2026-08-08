package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import com.meet2be.dao.entity.Poll;
import com.meet2be.model.enums.PollStatus;

public interface PollRepository extends JpaRepository<Poll, Long> {
    List<Poll> findBySessionId(Long sessionId);

    Optional<Poll> findFirstBySessionIdAndStatus(Long sessionId, PollStatus status);
}
