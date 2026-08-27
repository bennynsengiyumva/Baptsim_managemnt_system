package com.church.baptism.controller;

import com.church.baptism.dto.request.*;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.security.JwtService;
import com.church.baptism.service.auth.AuthService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Key;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request
    ) {

        return ResponseEntity.ok(
                authService.register(request)
        );
    }
@PostMapping("/create-user")
public ResponseEntity<?> createUser(
        @RequestBody RegisterRequest request,
        Authentication authentication
) {

    System.out.println("AUTH = " + authentication);

    if (authentication == null) {
        return ResponseEntity
                .status(401)
                .body("User is not authenticated");
    }

    User creator = userRepository
            .findByEmail(authentication.getName())
            .orElseThrow(() ->
                    new RuntimeException("Creator not found"));

    return ResponseEntity.ok(
            authService.createUser(request, creator)
    );
}

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request
    ) {

        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verifyTwoFactor(
            @RequestBody TwoFactorVerifyRequest request
    ) {
        return ResponseEntity.ok(
                authService.verifyTwoFactor(request)
        );
    }

    @PostMapping("/two-factor/resend")
    public ResponseEntity<?> resendTwoFactorCode(
            @RequestBody Map<String, String> body
    ) {
        authService.resendTwoFactorCode(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "Code resent successfully"));
    }

    @GetMapping("/two-factor/status")
    public ResponseEntity<?> getTwoFactorStatus(
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        boolean enabled = authService.getTwoFactorStatus(authentication.getName());
        return ResponseEntity.ok(Map.of("twoFactorEnabled", enabled));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole().name(),
                "roleChangeMessage", user.getRoleChangeMessage() != null ? user.getRoleChangeMessage() : ""
        ));
    }

    @PostMapping("/two-factor/send-setup-code")
    public ResponseEntity<?> sendSetupCode(
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        authService.sendTwoFactorSetupCode(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Verification code sent to your email"));
    }

    @PostMapping("/two-factor/enable")
    public ResponseEntity<?> enableTwoFactor(
            @RequestBody TwoFactorSetupRequest request,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        authService.enableTwoFactor(authentication.getName(), request.code);
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication enabled"));
    }

    @PostMapping("/two-factor/disable")
    public ResponseEntity<?> disableTwoFactor(
            @RequestBody TwoFactorSetupRequest request,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        authService.disableTwoFactor(authentication.getName(), request.password);
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication disabled"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody Map<String, String> body
    ) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        try {
            authService.forgotPassword(email);
            return ResponseEntity.ok(Map.of("message", "Password reset token sent to your email"));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(Map.of("message", "If the email exists, a reset token has been sent"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Missing or invalid token"));
        }
        String token = authHeader.substring(7);
        try {
            Claims claims = jwtService.extractClaimsRelaxed(token);
            String email = claims.getSubject();
            String role = claims.get("role", String.class);
            if (email == null || role == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid token claims"));
            }
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null || !user.isEnabled()) {
                return ResponseEntity.status(401).body(Map.of("message", "User not found or disabled"));
            }
            String newToken = jwtService.generateToken(email, role);
            return ResponseEntity.ok(Map.of(
                "token", newToken,
                "user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "fullName", user.getFullName(),
                    "role", user.getRole().name(),
                    "enabled", user.isEnabled()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired token"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, String> body
    ) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token is required"));
        }
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
        }

        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            authService.verifyEmail(token);
            return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        try {
            authService.resendVerificationEmail(email);
            return ResponseEntity.ok(Map.of("message", "Verification email sent"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Google ID token is required"));
        }
        try {
            return ResponseEntity.ok(authService.googleLogin(idToken));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}