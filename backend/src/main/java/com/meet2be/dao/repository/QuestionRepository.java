package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import com.meet2be.dao.entity.Question;
import com.meet2be.model.enums.QuestionStatus;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    Optional<Question> findFirstBySessionIdAndStatus(Long sessionId, QuestionStatus status);
}
