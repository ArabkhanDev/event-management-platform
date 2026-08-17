package com.auda.dao.repository;

import com.auda.dao.entity.SessionPlayer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SessionPlayerRepository extends JpaRepository<SessionPlayer, Long> {

    Optional<SessionPlayer> findBySessionIdAndVoterToken(Long sessionId, String voterToken);

    Optional<SessionPlayer> findBySessionIdAndNameLower(Long sessionId, String nameLower);

    List<SessionPlayer> findBySessionId(Long sessionId);
}
