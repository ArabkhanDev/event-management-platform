package com.auda.service;

import com.auda.model.dto.AuthenticatedUser;

public interface JwtService {

    String generateToken(Long userId, String email);

    /**
     * Parses and validates the token, returning the authenticated principal.
     * Throws JwtException (or a subclass) if the token is invalid/expired.
     */
    AuthenticatedUser parseToken(String token);

    boolean isValid(String token);
}
