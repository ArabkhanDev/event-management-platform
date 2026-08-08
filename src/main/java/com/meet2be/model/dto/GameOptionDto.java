package com.meet2be.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GameOptionDto {
    private Long id;
    private String label;
    private long answerCount;

    // Always present; the frontend simply doesn't render this to attendees
    // until the question is CLOSED, so the reveal still feels like a reveal
    // without needing two different DTO shapes for authed vs. public callers.
    private boolean correct;
}
