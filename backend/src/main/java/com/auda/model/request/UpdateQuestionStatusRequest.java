package com.auda.model.request;

import com.auda.model.enums.QuestionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateQuestionStatusRequest {
    private QuestionStatus status;
}
