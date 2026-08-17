package com.auda.model.dto;

import com.auda.model.enums.PollStatus;
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
