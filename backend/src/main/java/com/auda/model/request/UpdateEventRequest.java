package com.auda.model.request;

import com.auda.model.enums.EventStatus;
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
