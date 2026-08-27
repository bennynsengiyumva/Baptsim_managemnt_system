package com.church.baptism.controller;

import com.church.baptism.dto.request.DistrictTransferRequest;
import com.church.baptism.dto.response.DistrictAssignmentResponse;
import com.church.baptism.service.church.DistrictAssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/district-assignments")
@CrossOrigin("*")
public class DistrictAssignmentController {

    private final DistrictAssignmentService assignmentService;

    public DistrictAssignmentController(DistrictAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<DistrictAssignmentResponse> transferHead(
            @Valid @RequestBody DistrictTransferRequest request,
            Principal principal) {
        return ResponseEntity.ok(assignmentService.transferHeadOfDistrict(request, principal.getName()));
    }

    @PostMapping("/reassign")
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<DistrictAssignmentResponse> reassignHead(
            @Valid @RequestBody DistrictTransferRequest request,
            Principal principal) {
        return ResponseEntity.ok(assignmentService.reassignHeadOfDistrict(request, principal.getName()));
    }

    @GetMapping("/district/{districtId}")
    public ResponseEntity<DistrictAssignmentResponse> getActiveForDistrict(@PathVariable Long districtId) {
        return ResponseEntity.ok(assignmentService.getActiveAssignmentForDistrict(districtId));
    }

    @GetMapping("/pastor/{pastorId}")
    public ResponseEntity<DistrictAssignmentResponse> getActiveForPastor(@PathVariable Long pastorId) {
        return ResponseEntity.ok(assignmentService.getActiveAssignmentForPastor(pastorId));
    }

    @GetMapping("/district/{districtId}/history")
    public ResponseEntity<List<DistrictAssignmentResponse>> getHistory(@PathVariable Long districtId) {
        return ResponseEntity.ok(assignmentService.getAssignmentHistory(districtId));
    }

    @GetMapping("/pastor/{pastorId}/history")
    public ResponseEntity<List<DistrictAssignmentResponse>> getHistoryForPastor(@PathVariable Long pastorId) {
        return ResponseEntity.ok(assignmentService.getAssignmentHistoryForPastor(pastorId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<List<DistrictAssignmentResponse>> getAll() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }
}
