package com.auda.service.handler;

import com.auda.config.CampaignLinksProperties;
import com.auda.dao.entity.User;
import com.auda.dao.repository.UserRepository;
import com.auda.exception.ApiException;
import com.auda.model.dto.UserDto;
import com.auda.model.request.ForgotPasswordRequest;
import com.auda.model.request.LoginRequest;
import com.auda.model.request.RegisterRequest;
import com.auda.model.request.ResendVerificationRequest;
import com.auda.model.request.ResetPasswordRequest;
import com.auda.model.request.VerifyEmailRequest;
import com.auda.model.response.AuthResponse;
import com.auda.service.AuthService;
import com.auda.service.EmailSender;
import com.auda.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceHandler implements AuthService {

    private static final Duration VERIFICATION_TOKEN_TTL = Duration.ofHours(24);
    private static final Duration RESET_TOKEN_TTL = Duration.ofHours(1);
    private static final int TOKEN_BYTES = 32;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailSender emailSender;
    private final CampaignLinksProperties linksProperties;
    private final SecureRandom random = new SecureRandom();

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw ApiException.conflict("error.auth.emailTaken");
        }

        String token = generateToken();
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .emailVerified(false)
                .verificationToken(token)
                .verificationTokenExpiresAt(Instant.now().plus(VERIFICATION_TOKEN_TTL))
                .build();
        user = userRepository.save(user);

        log.info("ActionLog.register : User registered successfully, awaiting verification, userId={}", user.getId());
        sendVerificationEmail(user, token);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (user.isBlocked()) {
            log.warn("ActionLog.login : Rejected login for a blocked account, userId={}", user.getId());
            throw ApiException.of(HttpStatus.FORBIDDEN, "ACCOUNT_BLOCKED", "error.auth.accountBlocked");
        }
        if (!user.isEmailVerified()) {
            log.warn("ActionLog.login : Rejected login for an unverified account, userId={}", user.getId());
            throw ApiException.of(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "error.auth.emailNotVerified");
        }

        log.info("ActionLog.login : User logged in successfully, userId={}", user.getId());
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByVerificationToken(request.getToken())
                .orElseThrow(() -> ApiException.of(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "error.auth.invalidVerificationToken"));

        if (user.getVerificationTokenExpiresAt() == null || user.getVerificationTokenExpiresAt().isBefore(Instant.now())) {
            log.warn("ActionLog.verifyEmail : Rejected an expired verification token, userId={}", user.getId());
            throw ApiException.of(HttpStatus.BAD_REQUEST, "TOKEN_EXPIRED", "error.auth.verificationTokenExpired");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);
        user = userRepository.save(user);

        log.info("ActionLog.verifyEmail : Email verified successfully, userId={}", user.getId());
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void resendVerification(ResendVerificationRequest request) {
        userRepository.findByEmail(request.getEmail())
                .filter(user -> !user.isEmailVerified())
                .ifPresent(this::reissueVerification);
    }

    private void reissueVerification(User user) {
        String token = generateToken();
        user.setVerificationToken(token);
        user.setVerificationTokenExpiresAt(Instant.now().plus(VERIFICATION_TOKEN_TTL));
        userRepository.save(user);
        log.info("ActionLog.resendVerification : Verification email reissued, userId={}", user.getId());
        sendVerificationEmail(user, token);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(this::issuePasswordReset);
    }

    private void issuePasswordReset(User user) {
        String token = generateToken();
        user.setResetToken(token);
        user.setResetTokenExpiresAt(Instant.now().plus(RESET_TOKEN_TTL));
        userRepository.save(user);
        log.info("ActionLog.forgotPassword : Password reset issued, userId={}", user.getId());
        sendResetEmail(user, token);
    }

    @Override
    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> ApiException.of(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "error.auth.invalidResetToken"));

        if (user.getResetTokenExpiresAt() == null || user.getResetTokenExpiresAt().isBefore(Instant.now())) {
            log.warn("ActionLog.resetPassword : Rejected an expired reset token, userId={}", user.getId());
            throw ApiException.of(HttpStatus.BAD_REQUEST, "TOKEN_EXPIRED", "error.auth.resetTokenExpired");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiresAt(null);
        user = userRepository.save(user);

        log.info("ActionLog.resetPassword : Password reset successfully, userId={}", user.getId());
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder().token(token).user(UserDto.from(user)).build();
    }

    /** URL-safe, unguessable, and short enough to sit comfortably in a query string. */
    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void sendVerificationEmail(User user, String token) {
        String link = UriComponentsBuilder.fromHttpUrl(linksProperties.getAppBaseUrl())
                .path("/verify-email")
                .queryParam("token", token)
                .toUriString();
        emailSender.sendAsync(user.getEmail(), "Verify your auda account", buildVerificationEmailHtml(user, link));
    }

    private void sendResetEmail(User user, String token) {
        String link = UriComponentsBuilder.fromHttpUrl(linksProperties.getAppBaseUrl())
                .path("/reset-password")
                .queryParam("token", token)
                .toUriString();
        emailSender.sendAsync(user.getEmail(), "Reset your auda password", buildResetEmailHtml(user, link));
    }

    private String buildVerificationEmailHtml(User user, String link) {
        return """
                <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#141414;max-width:520px;">
                  <p>Hi %s,</p>
                  <p>Confirm your email to finish setting up your auda account.</p>
                  <p>
                    <a href="%s" style="display:inline-block;padding:10px 22px;background:#2952E3;color:#ffffff;
                       text-decoration:none;border-radius:4px;font-weight:bold;">Verify email</a>
                  </p>
                  <p style="color:#666;font-size:13px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
                </div>
                """.formatted(escapeHtml(user.getName()), link);
    }

    private String buildResetEmailHtml(User user, String link) {
        return """
                <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#141414;max-width:520px;">
                  <p>Hi %s,</p>
                  <p>We received a request to reset your auda password.</p>
                  <p>
                    <a href="%s" style="display:inline-block;padding:10px 22px;background:#2952E3;color:#ffffff;
                       text-decoration:none;border-radius:4px;font-weight:bold;">Reset password</a>
                  </p>
                  <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>
                </div>
                """.formatted(escapeHtml(user.getName()), link);
    }

    private String escapeHtml(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
