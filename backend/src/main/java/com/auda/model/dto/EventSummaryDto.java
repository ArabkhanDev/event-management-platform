package com.auda.model.dto;

import com.auda.dao.entity.Event;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EventSummaryDto {
    private Long id;
    private String name;
    private String description;

    public static EventSummaryDto from(Event event) {
        return new EventSummaryDto(event.getId(), event.getName(), event.getDescription());
    }
}
