package com.church.baptism.controller;

import com.church.baptism.dto.request.CohortRequest;
import com.church.baptism.dto.response.CohortMemberResponse;
import com.church.baptism.dto.response.CohortResponse;
import com.church.baptism.service.cohort.CohortService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cohorts")
public class CohortController {

    private final CohortService cohortService;

    public CohortController(CohortService cohortService) {
        this.cohortService = cohortService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<CohortResponse> createCohort(@RequestBody CohortRequest request) {
        return ResponseEntity.ok(cohortService.createCohort(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<CohortResponse> updateCohort(@PathVariable Long id, @RequestBody CohortRequest request) {
        return ResponseEntity.ok(cohortService.updateCohort(id, request));
    }

    @GetMapping
    public ResponseEntity<List<CohortResponse>> getAllCohorts() {
        return ResponseEntity.ok(cohortService.getAllCohorts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CohortResponse> getCohortById(@PathVariable Long id) {
        return ResponseEntity.ok(cohortService.getCohortById(id));
    }

    @GetMapping("/by-instructor/{instructorId}")
    public ResponseEntity<List<CohortResponse>> getCohortsByInstructor(@PathVariable Long instructorId) {
        return ResponseEntity.ok(cohortService.getCohortsByInstructor(instructorId));
    }

    @GetMapping("/by-church/{churchId}")
    public ResponseEntity<List<CohortResponse>> getCohortsByChurch(@PathVariable Long churchId) {
        return ResponseEntity.ok(cohortService.getCohortsByChurch(churchId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<Void> deleteCohort(@PathVariable Long id) {
        cohortService.deleteCohort(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<CohortMemberResponse> enrollCandidate(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(cohortService.enrollCandidate(id, body.get("candidateId")));
    }

    @PostMapping("/{id}/approve/{candidateId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<CohortMemberResponse> approveEnrollment(
            @PathVariable Long id,
            @PathVariable Long candidateId) {
        return ResponseEntity.ok(cohortService.approveEnrollment(id, candidateId));
    }

    @PostMapping("/{id}/bulk-enroll")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<List<CohortMemberResponse>> bulkEnroll(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> body) {
        return ResponseEntity.ok(cohortService.bulkEnroll(id, body.get("candidateIds")));
    }

    @PostMapping("/{id}/auto-assign")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<List<CohortMemberResponse>> autoAssignEligible(@PathVariable Long id) {
        return ResponseEntity.ok(cohortService.autoAssignEligible(id));
    }

    @DeleteMapping("/{id}/withdraw/{candidateId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<Void> withdrawCandidate(
            @PathVariable Long id,
            @PathVariable Long candidateId) {
        cohortService.withdrawCandidate(id, candidateId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<Map<String, Object>> getCohortProgress(@PathVariable Long id) {
        return ResponseEntity.ok(cohortService.getCohortProgress(id));
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<List<Map<String, Object>>> getCohortReport(@PathVariable Long id) {
        return ResponseEntity.ok(cohortService.getCohortReport(id));
    }

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('FIRST_CHURCH_ELDER', 'ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT')")
    public ResponseEntity<CohortMemberResponse> assignCandidateToCohort(@RequestBody Map<String, Long> body) {
        Long candidateId = body.get("candidateId");
        Long instructorId = body.get("instructorId");
        Long cohortId = body.get("cohortId");
        return ResponseEntity.ok(cohortService.assignCandidateToCohort(candidateId, instructorId, cohortId));
    }

    @GetMapping("/by-church/{churchId}/active")
    public ResponseEntity<List<CohortResponse>> getActiveCohortsByChurch(@PathVariable Long churchId) {
        return ResponseEntity.ok(cohortService.getActiveCohortsByChurch(churchId));
    }

    @GetMapping("/instructor/{instructorId}/stats")
    public ResponseEntity<Map<String, Object>> getInstructorCohortStats(@PathVariable Long instructorId) {
        return ResponseEntity.ok(cohortService.getInstructorCohortStats(instructorId));
    }

    @GetMapping("/stats/church/{churchId}")
    public ResponseEntity<Map<String, Object>> getChurchCohortStats(@PathVariable Long churchId) {
        return ResponseEntity.ok(cohortService.getChurchCohortStats(churchId));
    }
}
