package com.meet2be.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Broadcast when a game question is removed. Carries only identifiers because
 * the question itself no longer exists — clients use it to drop the question
 * from whatever they are showing.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DeletedGameQuestionDto {
    private Long id;
    private Long sessionId;
}
