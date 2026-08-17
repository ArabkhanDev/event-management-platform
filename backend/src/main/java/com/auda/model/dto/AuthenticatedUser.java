package com.auda.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight principal placed in the SecurityContext by {@link JwtAuthFilter}.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticatedUser {
    private Long id;
    private String email;
}
