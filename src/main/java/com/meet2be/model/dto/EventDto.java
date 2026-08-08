package com.meet2be.model.dto;

import com.meet2be.dao.entity.Event;
import com.meet2be.model.enums.EventStatus;
import com.meet2be.model.dto.SessionDto;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EventDto {
    private Long id;
    private String name;
    private String description;
    private String joinCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private EventStatus status;
    private List<SessionDto> sessions;

    public static EventDto from(Event event, List<SessionDto> sessions) {
        return new EventDto(
                event.getId(),
                event.getName(),
                event.getDescription(),
                event.getJoinCode(),
                event.getStartDate(),
                event.getEndDate(),
                event.getStatus(),
                sessions
        );
    }
}
