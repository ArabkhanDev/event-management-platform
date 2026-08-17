package com.auda.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.auda.dao.entity.SurveyAnswer;

public interface SurveyAnswerRepository extends JpaRepository<SurveyAnswer, Long> {
    List<SurveyAnswer> findByResponseId(Long responseId);

    List<SurveyAnswer> findByQuestionId(Long questionId);
}
