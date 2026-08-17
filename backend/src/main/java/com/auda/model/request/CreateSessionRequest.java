package com.auda.model.request;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateSessionRequest {
    private String title;
    private String speakerName;
    private String hallName;
    private Instant startTime;
    private Instant endTime;
}
