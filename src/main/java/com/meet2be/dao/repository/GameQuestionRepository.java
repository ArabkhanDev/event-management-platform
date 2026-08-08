package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import com.meet2be.dao.entity.GameQuestion;
import com.meet2be.model.enums.GameStatus;

public interface GameQuestionRepository extends JpaRepository<GameQuestion, Long> {
    List<GameQuestion> findBySessionId(Long sessionId);

    Optional<GameQuestion> findFirstBySessionIdAndStatus(Long sessionId, GameStatus status);
}
