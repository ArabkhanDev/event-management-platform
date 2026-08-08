package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.meet2be.dao.entity.GameAnswer;

public interface GameAnswerRepository extends JpaRepository<GameAnswer, Long> {
    boolean existsByQuestionIdAndVoterToken(Long questionId, String voterToken);

    long countByOptionId(Long optionId);

    List<GameAnswer> findBySessionId(Long sessionId);
}
