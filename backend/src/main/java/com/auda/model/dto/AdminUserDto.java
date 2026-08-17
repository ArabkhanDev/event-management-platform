package com.auda.model.dto;

import com.auda.model.enums.PlanTier;
import com.auda.model.enums.UserRole;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One organiser as the admin panel sees them. Never carries the password hash
 * — the admin API is a support tool, not a reason to move credentials around.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminUserDto {
    private Long id;
    private String name;
    private String email;
    private PlanTier plan;
    private UserRole role;
    private boolean blocked;
    private long eventCount;
    private Instant createdAt;
}
