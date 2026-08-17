package com.auda.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.auda.dao.entity.Survey;

public interface SurveyRepository extends JpaRepository<Survey, Long> {
    List<Survey> findBySessionId(Long sessionId);
}
