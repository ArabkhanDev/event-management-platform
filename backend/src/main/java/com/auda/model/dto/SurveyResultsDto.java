package com.auda.model.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SurveyResultsDto {
    private Long surveyId;
    private String title;
    private long responseCount;
    private List<SurveyQuestionResultDto> questions;
}
