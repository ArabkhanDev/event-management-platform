package com.meet2be.model.request;

import com.meet2be.model.enums.SurveyQuestionType;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateSurveyQuestionRequest {
    private String prompt;
    private SurveyQuestionType type;
    private List<String> options;
}
