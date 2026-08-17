package com.auda.model.request;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateEventRequest {
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
}
