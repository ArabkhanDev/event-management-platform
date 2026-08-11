package com.meet2be.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meet2be.dao.entity.User;
import com.meet2be.dao.repository.UserRepository;
import com.meet2be.exception.ErrorResponse;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import com.meet2be.service.JwtService;
import com.meet2be.model.dto.AuthenticatedUser;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final MessageSource messageSource;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HEADER);
        if (header != null && header.startsWith(PREFIX)) {
            String token = header.substring(PREFIX.length());
            try {
                AuthenticatedUser user = jwtService.parseToken(token);
                if (isBlocked(user.getId())) {
                    log.warn("ActionLog.doFilterInternal : Rejected request from a blocked account, userId={}", user.getId());
                    writeBlockedResponse(request, response);
                    return;
                }
                var authentication = new UsernamePasswordAuthenticationToken(user, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException e) {
                // invalid/expired token: leave context unauthenticated, let Security handle access
                log.warn("ActionLog.doFilterInternal : Rejected request with invalid or expired token, reason={}",
                        e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }

    /**
     * Checked on every authenticated request, not just at login: a JWT stays
     * valid for up to seven days, so a login-only check would let an admin's
     * block take up to a week to actually take effect. A user id the DB no
     * longer recognises is treated as not-blocked rather than rejected here —
     * there is no account-deletion path yet, so that case is unreachable in
     * practice and not worth a second failure mode.
     */
    private boolean isBlocked(Long userId) {
        return userRepository.findById(userId).map(User::isBlocked).orElse(false);
    }

    /**
     * Written directly rather than thrown as an ApiException: this filter runs
     * ahead of DispatcherServlet, so GlobalExceptionHandler's @ExceptionHandler
     * machinery is never in the call path here. request.getLocale() (not
     * LocaleContextHolder) is used for the same reason — the locale resolver
     * that backs LocaleContextHolder hasn't run yet at this point.
     */
    private void writeBlockedResponse(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String message = resolveMessage("error.auth.accountBlocked", request);
        ErrorResponse body = ErrorResponse.of(403, "Forbidden", message, "ACCOUNT_BLOCKED");

        response.setStatus(403);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private String resolveMessage(String code, HttpServletRequest request) {
        try {
            return messageSource.getMessage(code, null, request.getLocale());
        } catch (NoSuchMessageException e) {
            return code;
        }
    }
}
