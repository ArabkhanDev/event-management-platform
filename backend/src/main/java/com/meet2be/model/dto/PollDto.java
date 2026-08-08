package com.meet2be.model.dto;

import com.meet2be.model.enums.PollStatus;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PollDto {
    private Long id;
    private Long sessionId;
    private String prompt;
    private PollStatus status;
    private List<PollOptionDto> options;
}
