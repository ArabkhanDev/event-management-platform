package com.auda.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import com.auda.dao.entity.GameAnswer;
import com.auda.model.enums.GameStatus;

public interface GameAnswerRepository extends JpaRepository<GameAnswer, Long> {
    boolean existsByQuestionIdAndVoterToken(Long questionId, String voterToken);

    long countByOptionId(Long optionId);

    List<GameAnswer> findBySessionId(Long sessionId);

    /**
     * Answers belonging to questions currently in the given status. The
     * leaderboard uses this with CLOSED so points only count once the host has
     * revealed the question — while it is live, a rising score would tell the
     * room who answered correctly.
     */
    @Query("select a from GameAnswer a join GameQuestion q on q.id = a.questionId "
            + "where a.sessionId = :sessionId and q.status = :status")
    List<GameAnswer> findBySessionIdAndQuestionStatus(@Param("sessionId") Long sessionId,
                                                      @Param("status") GameStatus status);

    void deleteByQuestionId(Long questionId);
}
