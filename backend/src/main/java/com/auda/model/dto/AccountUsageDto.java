package com.auda.model.dto;

import com.auda.model.enums.PlanTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * What an organiser's plan allows and how much of it this calendar year's
 * quota is already used. The attendee cap is per-event, not accountwide, so
 * it is reported as the plan's limit rather than a used/total pair here — the
 * per-event figure lives on {@link EventDto} instead.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountUsageDto {
    private PlanTier plan;
    private long eventsUsedThisYear;
    /** Null when the plan has no yearly cap (Enterprise). */
    private Integer eventsPerYear;
    private Integer attendeesPerEvent;
}
