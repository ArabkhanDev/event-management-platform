package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.meet2be.dao.entity.Survey;

public interface SurveyRepository extends JpaRepository<Survey, Long> {
    List<Survey> findBySessionId(Long sessionId);
}
