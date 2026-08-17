package com.auda.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.auda.dao.entity.SurveyQuestion;

public interface SurveyQuestionRepository extends JpaRepository<SurveyQuestion, Long> {
    List<SurveyQuestion> findBySurveyIdOrderByOrderIndexAsc(Long surveyId);
}
