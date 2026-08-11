package com.meet2be.service;

import com.meet2be.model.request.ForgotPasswordRequest;
import com.meet2be.model.request.LoginRequest;
import com.meet2be.model.request.RegisterRequest;
import com.meet2be.model.request.ResendVerificationRequest;
import com.meet2be.model.request.ResetPasswordRequest;
import com.meet2be.model.request.VerifyEmailRequest;
import com.meet2be.model.response.AuthResponse;

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
