package com.meet2be.model.dto;

import com.meet2be.dao.entity.SurveyQuestion;
import com.meet2be.model.enums.SurveyQuestionType;
import java.util.Arrays;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SurveyQuestionDto {
    private Long id;
    private String prompt;
    private SurveyQuestionType type;
    private List<String> options;

    public static SurveyQuestionDto from(SurveyQuestion question) {
        List<String> options = question.getOptionsCsv() == null || question.getOptionsCsv().isBlank()
                ? List.of()
                : Arrays.asList(question.getOptionsCsv().split(","));
        return new SurveyQuestionDto(question.getId(), question.getPrompt(), question.getType(), options);
    }
}
