package com.auda.model.dto;

import com.auda.dao.entity.Survey;
import com.auda.model.enums.SurveyStatus;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SurveyDto {
    private Long id;
    private Long sessionId;
    private String title;
    private SurveyStatus status;
    private List<SurveyQuestionDto> questions;

    public static SurveyDto from(Survey survey, List<SurveyQuestionDto> questions) {
        return new SurveyDto(survey.getId(), survey.getSession().getId(), survey.getTitle(), survey.getStatus(), questions);
    }
}
