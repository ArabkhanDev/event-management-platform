package com.auda.service;

import com.auda.model.request.ForgotPasswordRequest;
import com.auda.model.request.LoginRequest;
import com.auda.model.request.RegisterRequest;
import com.auda.model.request.ResendVerificationRequest;
import com.auda.model.request.ResetPasswordRequest;
import com.auda.model.request.VerifyEmailRequest;
import com.auda.model.response.AuthResponse;

public interface AuthService {

    /** Creates the account unverified and emails a verification link; issues no token. */
    void register(RegisterRequest request);

    /** Rejects with EMAIL_NOT_VERIFIED if the account has not confirmed its email yet. */
    AuthResponse login(LoginRequest request);

    /** Confirms the account and logs it in immediately, the same as a fresh login. */
    AuthResponse verifyEmail(VerifyEmailRequest request);

    /**
     * Always succeeds from the caller's point of view regardless of whether the
     * email is registered or already verified — revealing which would let a
     * caller enumerate registered accounts.
     */
    void resendVerification(ResendVerificationRequest request);

    /** Same no-enumeration contract as {@link #resendVerification}. */
    void forgotPassword(ForgotPasswordRequest request);

    /** Sets the new password and logs the account in immediately. */
    AuthResponse resetPassword(ResetPasswordRequest request);
}
