package com.meet2be.model.dto;

import com.meet2be.model.enums.GameStatus;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GameQuestionDto {
    private Long id;
    private Long sessionId;
    private String prompt;
    private GameStatus status;
    private int points;
    private List<GameOptionDto> options;
}
