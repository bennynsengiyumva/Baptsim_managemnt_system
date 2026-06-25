package com.church.baptism.controller;

import com.church.baptism.dto.request.ProfileUpdateRequest;
import com.church.baptism.dto.request.RegisterRequest;
import com.church.baptism.dto.response.UserResponse;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.activity.ActivityLogService;
import com.church.baptism.service.auth.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(toResponse(user));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(toResponse(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @RequestBody ProfileUpdateRequest request
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        userRepository.save(user);
        return ResponseEntity.ok(toResponse(user));
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody RegisterRequest request, Authentication authentication) {
        User creator = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Creator not found"));
        return ResponseEntity.ok(authService.createUser(request, creator));
    }

    @GetMapping("/pastors")
    public ResponseEntity<List<UserResponse>> getPastors() {
        List<UserResponse> pastors = userRepository.findByRole(Role.PASTOR)
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(pastors);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> toggleUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            Authentication auth,
            HttpServletRequest request
    ) {
        User admin = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        User target = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean enabled = body.getOrDefault("enabled", true);
        target.setEnabled(enabled);
        userRepository.save(target);

        activityLogService.log(admin,
                enabled ? "USER_ENABLED" : "USER_DISABLED",
                (enabled ? "Enabled" : "Disabled") + " user: " + target.getEmail(),
                "User", target.getId(), true, request);

        return ResponseEntity.ok(Map.of("success", true, "enabled", enabled));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth,
            HttpServletRequest request
    ) {
        User admin = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        User target = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newRole = body.get("role");
        target.setRole(Role.valueOf(newRole));
        userRepository.save(target);

        activityLogService.log(admin,
                "USER_ROLE_CHANGED",
                "Changed role of " + target.getEmail() + " to " + newRole,
                "User", target.getId(), true, request);

        return ResponseEntity.ok(Map.of("success", true, "role", newRole));
    }

    @GetMapping("/by-field/{fieldId}")
    public ResponseEntity<List<UserResponse>> getUsersByField(@PathVariable Long fieldId) {
        List<UserResponse> users = userRepository.findByFieldId(fieldId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getUserStats() {
        long total = userRepository.count();
        long admins = userRepository.countByRole(Role.ADMIN);
        long pastors = userRepository.countByRole(Role.PASTOR);
        long instructors = userRepository.countByRole(Role.INSTRUCTOR);
        long candidates = userRepository.countByRole(Role.CANDIDATE);

        return ResponseEntity.ok(Map.of(
                "total", total,
                "admins", admins,
                "pastors", pastors,
                "instructors", instructors,
                "candidates", candidates
        ));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .avatar(user.getAvatar())
                .twoFactorEnabled(user.isTwoFactorEnabled())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .unionName(user.getUnion() != null ? user.getUnion().getName() : null)
                .unionId(user.getUnion() != null ? user.getUnion().getId() : null)
                .fieldName(user.getField() != null ? user.getField().getName() : null)
                .fieldId(user.getField() != null ? user.getField().getId() : null)
                .districtName(user.getDistrict() != null ? user.getDistrict().getName() : null)
                .districtId(user.getDistrict() != null ? user.getDistrict().getId() : null)
                .churchName(user.getChurch() != null ? user.getChurch().getChurchName() : null)
                .churchId(user.getChurch() != null ? user.getChurch().getId() : null)
                .build();
    }
}
