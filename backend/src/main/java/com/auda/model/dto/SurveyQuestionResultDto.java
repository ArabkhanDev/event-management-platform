package com.auda.model.dto;

import com.auda.model.enums.SurveyQuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * `aggregate` is a List<OptionCount> for RATING/SINGLE_CHOICE/DROPDOWN questions
 * (grouped counts per distinct answer value), or a List<String> of raw answers
 * for TEXT questions.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SurveyQuestionResultDto {
    private Long questionId;
    private String prompt;
    private SurveyQuestionType type;
    private Object aggregate;
}
