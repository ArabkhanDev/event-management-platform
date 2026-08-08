package com.meet2be.util;

import com.meet2be.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.meet2be.model.dto.AuthenticatedUser;

/**
 * Helper for resolving the currently authenticated user's id/email from the
 * SecurityContext populated by {@link JwtAuthFilter}.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static AuthenticatedUser get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser user)) {
            throw ApiException.forbidden("error.auth.notAuthenticated");
        }
        return user;
    }

    public static Long id() {
        return get().getId();
    }
}
