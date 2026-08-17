package com.auda.model.dto;

import com.auda.dao.entity.Session;
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
public class SessionDto {
    private Long id;
    private Long eventId;
    private String title;
    private String speakerName;
    private String hallName;
    private Instant startTime;
    private Instant endTime;
    private SessionStatus status;
    private StageMode stageMode;

    public static SessionDto from(Session session) {
        return new SessionDto(
                session.getId(),
                session.getEvent().getId(),
                session.getTitle(),
                session.getSpeakerName(),
                session.getHallName(),
                session.getStartTime(),
                session.getEndTime(),
                session.getStatus(),
                session.getStageMode()
        );
    }
}
