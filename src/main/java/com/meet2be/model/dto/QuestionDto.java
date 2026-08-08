package com.meet2be.model.dto;

import com.meet2be.dao.entity.Question;
import com.meet2be.model.enums.QuestionStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuestionDto {
    private Long id;
    private Long sessionId;
    private String authorName;
    private String body;
    private QuestionStatus status;
    private Instant createdAt;

    public static QuestionDto from(Question question) {
        return new QuestionDto(
                question.getId(),
                question.getSession().getId(),
                question.getAuthorName(),
                question.getBody(),
                question.getStatus(),
                question.getCreatedAt()
        );
    }
}
