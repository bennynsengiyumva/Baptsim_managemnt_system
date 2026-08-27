package com.church.baptism.controller;

import com.church.baptism.dto.request.UnionRequest;
import com.church.baptism.dto.response.UnionResponse;
import com.church.baptism.entity.user.User;
import com.church.baptism.service.church.UnionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unions")
@RequiredArgsConstructor
public class UnionController {

    private final UnionService unionService;

    @GetMapping
    public ResponseEntity<List<UnionResponse>> getAll() {
        return ResponseEntity.ok(unionService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UnionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(unionService.getById(id));
    }

    @PostMapping
    public ResponseEntity<UnionResponse> create(@RequestBody UnionRequest request) {
        return ResponseEntity.ok(unionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UnionResponse> update(@PathVariable Long id, @RequestBody UnionRequest request) {
        return ResponseEntity.ok(unionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        unionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/head")
    public ResponseEntity<?> getHeadOfRum(@PathVariable Long id) {
        User head = unionService.getHeadOfRum(id);
        if (head == null) {
            return ResponseEntity.ok(Map.of("assigned", false));
        }
        return ResponseEntity.ok(Map.of(
                "assigned", true,
                "userId", head.getId(),
                "fullName", head.getFullName(),
                "email", head.getEmail(),
                "phone", head.getPhone() != null ? head.getPhone() : "",
                "role", head.getRole().name()
        ));
    }

    @PostMapping("/{id}/assign-head")
    public ResponseEntity<?> assignHeadOfRum(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String fullName = body.get("fullName");
        String email = body.get("email");
        String phone = body.get("phone");
        String password = body.get("password");

        if (fullName == null || email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "fullName, email, and password are required"));
        }

        User head = unionService.assignHeadOfRum(id, fullName, email, phone, password);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "userId", head.getId(),
                "fullName", head.getFullName(),
                "email", head.getEmail()
        ));
    }

    @PostMapping("/{id}/replace-head")
    public ResponseEntity<?> replaceHeadOfRum(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long newHeadUserId = body.get("userId");
        if (newHeadUserId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }

        User head = unionService.replaceHeadOfRum(id, newHeadUserId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "userId", head.getId(),
                "fullName", head.getFullName(),
                "email", head.getEmail()
        ));
    }
}
