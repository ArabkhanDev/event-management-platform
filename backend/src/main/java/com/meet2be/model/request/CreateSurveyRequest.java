package com.meet2be.model.request;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateSurveyRequest {
    private String title;
    private List<CreateSurveyQuestionRequest> questions;
}
