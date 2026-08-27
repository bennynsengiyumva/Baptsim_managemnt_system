package com.church.baptism.controller;

import com.church.baptism.dto.request.FieldTransferRequest;
import com.church.baptism.dto.response.FieldAssignmentResponse;
import com.church.baptism.service.church.FieldAssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/field-assignments")
@CrossOrigin("*")
public class FieldAssignmentController {

    private final FieldAssignmentService fieldAssignmentService;

    public FieldAssignmentController(FieldAssignmentService fieldAssignmentService) {
        this.fieldAssignmentService = fieldAssignmentService;
    }

    @PostMapping("/change-head")
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<FieldAssignmentResponse> changeHead(
            @Valid @RequestBody FieldTransferRequest request,
            Principal principal) {
        return ResponseEntity.ok(fieldAssignmentService.changeHeadOfField(request, principal.getName()));
    }

    @PostMapping("/appoint-head")
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<FieldAssignmentResponse> appointHead(
            @Valid @RequestBody FieldTransferRequest request,
            Principal principal) {
        return ResponseEntity.ok(fieldAssignmentService.appointHeadOfField(request, principal.getName()));
    }

    @GetMapping("/field/{fieldId}")
    public ResponseEntity<FieldAssignmentResponse> getActiveForField(@PathVariable Long fieldId) {
        return ResponseEntity.ok(fieldAssignmentService.getActiveAssignmentForField(fieldId));
    }

    @GetMapping("/head/{headId}")
    public ResponseEntity<FieldAssignmentResponse> getActiveForHead(@PathVariable Long headId) {
        return ResponseEntity.ok(fieldAssignmentService.getActiveAssignmentForHead(headId));
    }

    @GetMapping("/field/{fieldId}/history")
    public ResponseEntity<List<FieldAssignmentResponse>> getHistory(@PathVariable Long fieldId) {
        return ResponseEntity.ok(fieldAssignmentService.getAssignmentHistory(fieldId));
    }

    @GetMapping("/head/{headId}/history")
    public ResponseEntity<List<FieldAssignmentResponse>> getHistoryForHead(@PathVariable Long headId) {
        return ResponseEntity.ok(fieldAssignmentService.getAssignmentHistoryForHead(headId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<List<FieldAssignmentResponse>> getAll() {
        return ResponseEntity.ok(fieldAssignmentService.getAllAssignments());
    }
}
