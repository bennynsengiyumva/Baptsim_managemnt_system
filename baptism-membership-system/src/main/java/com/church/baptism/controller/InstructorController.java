package com.church.baptism.controller;

import com.church.baptism.dto.request.InstructorRequest;
import com.church.baptism.dto.response.InstructorResponse;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.instructor.InstructorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instructors")
@CrossOrigin(origins = "*")
public class InstructorController {

    private final InstructorService service;
    private final UserRepository userRepository;

    public InstructorController(InstructorService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<InstructorResponse> create(@RequestBody InstructorRequest request) {
        return ResponseEntity.ok(service.createInstructor(request));
    }

    @GetMapping
    public ResponseEntity<List<InstructorResponse>> getAll(Authentication authentication) {
        if (authentication != null) {
            User user = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (user != null && user.getRole() == Role.FIRST_CHURCH_ELDER && user.getChurch() != null) {
                return ResponseEntity.ok(service.getByChurchId(user.getChurch().getId()));
            }
        }
        return ResponseEntity.ok(service.getAllInstructors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InstructorResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getInstructorById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InstructorResponse> update(
            @PathVariable Long id,
            @RequestBody InstructorRequest request) {
        return ResponseEntity.ok(service.updateInstructor(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteInstructor(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/assign-candidates")
    public ResponseEntity<InstructorResponse> assignCandidates(
            @PathVariable Long id,
            @RequestBody List<Long> candidateIds) {
        return ResponseEntity.ok(service.assignCandidates(id, candidateIds));
    }

    @GetMapping("/stats")
    public ResponseEntity<InstructorService.InstructorStats> getStats() {
        return ResponseEntity.ok(service.getStatistics());
    }
}