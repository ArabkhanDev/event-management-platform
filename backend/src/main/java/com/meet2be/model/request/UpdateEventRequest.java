package com.meet2be.model.request;

import com.meet2be.model.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateEventRequest {
    private String name;
    private String description;
    private EventStatus status;
}
