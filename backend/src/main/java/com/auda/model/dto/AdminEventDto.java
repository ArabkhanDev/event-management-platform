package com.auda.model.dto;

import com.auda.model.enums.EventStatus;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * An event in the cross-account admin listing. Carries the owner inline so the
 * panel can show whose event it is without an N+1 lookup per row.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminEventDto {
    private Long id;
    private String name;
    private String joinCode;
    private EventStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Instant createdAt;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private int sessionCount;
}
