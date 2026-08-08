package com.meet2be.model.request;

import com.meet2be.model.enums.SessionStatus;
import com.meet2be.model.enums.StageMode;
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
