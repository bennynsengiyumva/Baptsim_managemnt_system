package com.church.baptism.controller;

import com.church.baptism.dto.response.CandidateResponse;
import com.church.baptism.service.candidate.CandidateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pastor")
public class PastorController {

    private final CandidateService service;

    public PastorController(CandidateService service) {
        this.service = service;
    }

    // ================= UNASSIGNED CANDIDATES BY CHURCH =================
    @GetMapping("/unassigned/{churchId}")
    public ResponseEntity<List<CandidateResponse>> getUnassigned(@PathVariable Long churchId) {
        return ResponseEntity.ok(service.getUnassignedCandidates(churchId));
    }

    // ================= ALL UNASSIGNED (no church filter) =================
    @GetMapping("/unassigned")
    public ResponseEntity<List<CandidateResponse>> getAllUnassigned() {
        return ResponseEntity.ok(service.getUnassignedCandidates(null));
    }

    // ================= ASSIGN INSTRUCTOR TO CANDIDATE =================
    @PatchMapping("/assign/{candidateId}/instructor/{instructorId}")
    public ResponseEntity<CandidateResponse> assignInstructor(
            @PathVariable Long candidateId,
            @PathVariable Long instructorId) {
        return ResponseEntity.ok(service.assignInstructor(candidateId, instructorId));
    }

    // ================= UNASSIGN INSTRUCTOR FROM CANDIDATE =================
    @PatchMapping("/unassign/{candidateId}")
    public ResponseEntity<CandidateResponse> unassignInstructor(@PathVariable Long candidateId) {
        return ResponseEntity.ok(service.unassignInstructor(candidateId));
    }

    // ================= CANDIDATES BY INSTRUCTOR =================
    @GetMapping("/instructor/{instructorId}/candidates")
    public ResponseEntity<List<CandidateResponse>> getCandidatesByInstructor(
            @PathVariable Long instructorId) {
        return ResponseEntity.ok(service.getCandidatesByInstructor(instructorId));
    }
}