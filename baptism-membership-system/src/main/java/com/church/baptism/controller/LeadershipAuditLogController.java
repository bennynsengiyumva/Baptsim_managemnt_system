package com.church.baptism.controller;

import com.church.baptism.dto.response.LeadershipAuditLogResponse;
import com.church.baptism.entity.audit.LeadershipAuditLog;
import com.church.baptism.service.audit.LeadershipAuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leadership-audit-logs")
@CrossOrigin("*")
public class LeadershipAuditLogController {

    private final LeadershipAuditLogService auditLogService;

    public LeadershipAuditLogController(LeadershipAuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<List<LeadershipAuditLogResponse>> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @GetMapping("/leader/{leaderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<List<LeadershipAuditLogResponse>> getLogsByLeader(@PathVariable Long leaderId) {
        return ResponseEntity.ok(auditLogService.getLogsByLeader(leaderId));
    }

    @GetMapping("/district/{districtId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<List<LeadershipAuditLogResponse>> getLogsByDistrict(@PathVariable Long districtId) {
        return ResponseEntity.ok(auditLogService.getLogsByDistrict(districtId));
    }

    @GetMapping("/field/{fieldId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<List<LeadershipAuditLogResponse>> getLogsByField(@PathVariable Long fieldId) {
        return ResponseEntity.ok(auditLogService.getLogsByField(fieldId));
    }

    @GetMapping("/event-type/{eventType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HEAD_OF_RUM')")
    public ResponseEntity<List<LeadershipAuditLogResponse>> getLogsByEventType(@PathVariable String eventType) {
        LeadershipAuditLog.EventType type = LeadershipAuditLog.EventType.valueOf(eventType);
        return ResponseEntity.ok(auditLogService.getLogsByEventType(type));
    }
}
