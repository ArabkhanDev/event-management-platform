package com.auda.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import com.auda.dao.entity.Question;
import com.auda.model.enums.QuestionStatus;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    Optional<Question> findFirstBySessionIdAndStatus(Long sessionId, QuestionStatus status);
}
