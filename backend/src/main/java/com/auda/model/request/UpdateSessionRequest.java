package com.auda.model.request;

import com.auda.model.enums.SessionStatus;
import com.auda.model.enums.StageMode;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateSessionRequest {
    private String title;
    private String speakerName;
    private String hallName;
    private Instant startTime;
    private Instant endTime;
    private SessionStatus status;
    private StageMode stageMode;
}
