package com.meet2be.model.request;

import com.meet2be.model.enums.SurveyStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateSurveyStatusRequest {
    private SurveyStatus status;
}
