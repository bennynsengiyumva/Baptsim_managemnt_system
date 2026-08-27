package com.church.baptism.service.auth;

import com.church.baptism.dto.request.LoginRequest;
import com.church.baptism.dto.request.RegisterRequest;
import com.church.baptism.dto.request.TwoFactorVerifyRequest;
import com.church.baptism.dto.response.AuthResponse;
import com.church.baptism.entity.user.User;

public interface AuthService {

    // Login
    AuthResponse login(LoginRequest request);

    // Verify 2FA code
    AuthResponse verifyTwoFactor(TwoFactorVerifyRequest request);

    // Resend 2FA code
    void resendTwoFactorCode(String email);

    // Initial registration (optional)
    AuthResponse register(RegisterRequest request);

    // Role-based user creation
    AuthResponse createUser(
            RegisterRequest request,
            User creator
    );

    // 2FA management
    void sendTwoFactorSetupCode(String email);

    void enableTwoFactor(String email, String code);

    void disableTwoFactor(String email, String password);

    boolean getTwoFactorStatus(String email);

    // Password reset
    void forgotPassword(String email);

    void resetPassword(String token, String newPassword);

    // Email verification
    void verifyEmail(String token);

    void resendVerificationEmail(String email);

    // Google OAuth
    AuthResponse googleLogin(String idToken);
}