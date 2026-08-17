package com.auda.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.auda.dao.entity.SurveyResponse;

public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {
    boolean existsBySurveyIdAndVoterToken(Long surveyId, String voterToken);

    List<SurveyResponse> findBySurveyId(Long surveyId);

    long countBySurveyId(Long surveyId);
}
