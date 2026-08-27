package com.church.baptism.controller;

import com.church.baptism.dto.response.ReportDataResponse;
import com.church.baptism.entity.audit.ReportAuditLog;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.audit.ReportAuditLogRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.report.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin("*")
public class ReportController {

    private final ReportService reportService;
    private final ReportAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final InstructorRepository instructorRepository;

    public ReportController(ReportService reportService, ReportAuditLogRepository auditLogRepository, UserRepository userRepository, InstructorRepository instructorRepository) {
        this.reportService = reportService;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.instructorRepository = instructorRepository;
    }

    // ==================== CANDIDATE REPORTS ====================

    @GetMapping("/candidate/my-progress")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ReportDataResponse> myProgress(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        ReportDataResponse response = reportService.getCandidateProgressReport(user.getId(), dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidate/my-lessons")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ReportDataResponse> myLessons(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        ReportDataResponse response = reportService.getCandidateLessonsReport(user.getId(), dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidate/my-baptism-status")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ReportDataResponse> myBaptismStatus(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        ReportDataResponse response = reportService.getCandidateBaptismStatusReport(user.getId(), dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidate/my-certificates")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ReportDataResponse> myCertificates(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        ReportDataResponse response = reportService.getCandidateCertificatesReport(user.getId(), dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidate/my-membership")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ReportDataResponse> myMembership(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        ReportDataResponse response = reportService.getCandidateMembershipReport(user.getId(), dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    // ==================== INSTRUCTOR REPORTS ====================

    @GetMapping("/instructor/assigned-candidates")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ReportDataResponse> assignedCandidates(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long instructorId = instructorRepository.findByEmail(user.getEmail()).map(Instructor::getId).orElse(user.getId());
        ReportDataResponse response = reportService.getAssignedCandidatesReport(instructorId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/instructor/candidate-progress")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ReportDataResponse> candidateProgress(Principal principal,
            @RequestParam(required = false) Long candidateId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long instructorId = instructorRepository.findByEmail(user.getEmail()).map(Instructor::getId).orElse(user.getId());
        ReportDataResponse response = reportService.getCandidateProgressReportForInstructor(instructorId, candidateId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "candidateId=" + candidateId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/instructor/lesson-completion")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ReportDataResponse> lessonCompletion(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long instructorId = instructorRepository.findByEmail(user.getEmail()).map(Instructor::getId).orElse(user.getId());
        ReportDataResponse response = reportService.getLessonCompletionReport(instructorId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    // ==================== FIRST CHURCH ELDER REPORTS ====================

    @GetMapping("/elder/baptism-requests")
    @PreAuthorize("hasRole('FIRST_CHURCH_ELDER')")
    public ResponseEntity<ReportDataResponse> baptismRequests(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long churchId = user.getChurch() != null ? user.getChurch().getId() : null;
        ReportDataResponse response = reportService.getBaptismRequestsReport(churchId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "churchId=" + churchId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/elder/approved-candidates")
    @PreAuthorize("hasRole('FIRST_CHURCH_ELDER')")
    public ResponseEntity<ReportDataResponse> approvedCandidates(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long churchId = user.getChurch() != null ? user.getChurch().getId() : null;
        ReportDataResponse response = reportService.getApprovedCandidatesReport(churchId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "churchId=" + churchId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/elder/candidates-ready")
    @PreAuthorize("hasRole('FIRST_CHURCH_ELDER')")
    public ResponseEntity<ReportDataResponse> candidatesReady(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long churchId = user.getChurch() != null ? user.getChurch().getId() : null;
        ReportDataResponse response = reportService.getCandidatesReadyReport(churchId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "churchId=" + churchId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    // ==================== PASTOR REPORTS ====================

    @GetMapping("/pastor/baptism-events")
    @PreAuthorize("hasRole('PASTOR')")
    public ResponseEntity<ReportDataResponse> baptismEvents(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long churchId = user.getChurch() != null ? user.getChurch().getId() : null;
        ReportDataResponse response = reportService.getBaptismEventsReport(churchId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "churchId=" + churchId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pastor/baptized-candidates")
    @PreAuthorize("hasRole('PASTOR')")
    public ResponseEntity<ReportDataResponse> baptizedCandidates(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long churchId = user.getChurch() != null ? user.getChurch().getId() : null;
        ReportDataResponse response = reportService.getBaptizedCandidatesReport(churchId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "churchId=" + churchId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pastor/certificate-signing")
    @PreAuthorize("hasRole('PASTOR')")
    public ResponseEntity<ReportDataResponse> certificateSigning(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long churchId = user.getChurch() != null ? user.getChurch().getId() : null;
        ReportDataResponse response = reportService.getCertificateSigningReport(churchId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "churchId=" + churchId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pastor/course-completion")
    @PreAuthorize("hasRole('PASTOR')")
    public ResponseEntity<ReportDataResponse> courseCompletion(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long churchId = user.getChurch() != null ? user.getChurch().getId() : null;
        ReportDataResponse response = reportService.getCourseCompletionReport(churchId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "churchId=" + churchId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    // ==================== HEAD OF FIELD REPORTS ====================

    @GetMapping("/field/district-baptism")
    @PreAuthorize("hasRole('HEAD_OF_FIELD')")
    public ResponseEntity<ReportDataResponse> districtBaptism(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long fieldId = user.getField() != null ? user.getField().getId() : null;
        ReportDataResponse response = reportService.getDistrictBaptismReport(fieldId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "fieldId=" + fieldId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/field/certificate-stats")
    @PreAuthorize("hasRole('HEAD_OF_FIELD')")
    public ResponseEntity<ReportDataResponse> certificateStats(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long fieldId = user.getField() != null ? user.getField().getId() : null;
        ReportDataResponse response = reportService.getCertificateStatsReport(fieldId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "fieldId=" + fieldId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/field/instructor-activity")
    @PreAuthorize("hasRole('HEAD_OF_FIELD')")
    public ResponseEntity<ReportDataResponse> instructorActivity(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long fieldId = user.getField() != null ? user.getField().getId() : null;
        ReportDataResponse response = reportService.getInstructorActivityReport(fieldId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "fieldId=" + fieldId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    // ==================== HEAD OF RUM REPORTS ====================

    @GetMapping("/rum/national-baptism")
    @PreAuthorize("hasRole('HEAD_OF_RUM')")
    public ResponseEntity<ReportDataResponse> nationalBaptism(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long unionId = user.getUnion() != null ? user.getUnion().getId() : null;
        ReportDataResponse response = reportService.getNationalBaptismReport(unionId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "unionId=" + unionId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rum/district-comparison")
    @PreAuthorize("hasRole('HEAD_OF_RUM')")
    public ResponseEntity<ReportDataResponse> districtComparison(Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
        Long unionId = user.getUnion() != null ? user.getUnion().getId() : null;
        ReportDataResponse response = reportService.getDistrictComparisonReport(unionId, dateFrom, dateTo);
        response.generatedBy = user.getEmail();
        response.generatedByName = user.getFullName();
        logReportGeneration(response.reportName, principal, "unionId=" + unionId + ",dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    // ==================== ADMIN REPORTS ====================

    @GetMapping("/admin/user-activity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportDataResponse> userActivity(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        ReportDataResponse response = reportService.getUserActivityReport(dateFrom, dateTo);
        response.generatedBy = "ADMIN";
        logReportGeneration(response.reportName, null, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/auth-report")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportDataResponse> authReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        ReportDataResponse response = reportService.getAuthReport(dateFrom, dateTo);
        response.generatedBy = "ADMIN";
        logReportGeneration(response.reportName, null, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/certificate-downloads")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportDataResponse> certificateDownloads(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        ReportDataResponse response = reportService.getCertificateDownloadsReport(dateFrom, dateTo);
        response.generatedBy = "ADMIN";
        logReportGeneration(response.reportName, null, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/messaging-report")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportDataResponse> messagingReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        ReportDataResponse response = reportService.getMessagingReport(dateFrom, dateTo);
        response.generatedBy = "ADMIN";
        logReportGeneration(response.reportName, null, "dateFrom=" + dateFrom + ",dateTo=" + dateTo, "VIEW", response.totalRecords);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportDataResponse> auditLogs() {
        List<ReportAuditLog> logs = auditLogRepository.findAllByOrderByGenerationDateDesc();
        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Report Generation Audit Log";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Report Name", "Generated By", "Role", "Format", "Records", "Generated At");
        response.records = new ArrayList<>();
        int idx = 1;
        for (ReportAuditLog log : logs) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Report Name", log.getReportName() != null ? log.getReportName() : "-");
            record.put("Generated By", log.getGeneratedBy() != null ? log.getGeneratedBy() : "-");
            record.put("Role", log.getGeneratedByRole() != null ? log.getGeneratedByRole() : "-");
            record.put("Format", log.getFormat() != null ? log.getFormat() : "-");
            record.put("Records", log.getRecordCount());
            record.put("Generated At", log.getGenerationDate() != null ? log.getGenerationDate().toString() : "-");
            response.records.add(record);
        }
        response.totalRecords = response.records.size();
        return ResponseEntity.ok(response);
    }

    // ==================== HIERARCHY DATA ENDPOINTS ====================

    @GetMapping("/district/{districtId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_OF_RUM','HEAD_OF_FIELD','HEAD_OF_DISTRICT','PASTOR','FIRST_CHURCH_ELDER')")
    public ResponseEntity<ReportDataResponse> districtReport(@PathVariable Long districtId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status) {
        ReportDataResponse response = reportService.getDistrictReport(districtId, dateFrom, dateTo, status);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/field/{fieldId}")
    @PreAuthorize("hasAnyRole('ADMIN','HEAD_OF_RUM','HEAD_OF_FIELD')")
    public ResponseEntity<ReportDataResponse> fieldReport(@PathVariable Long fieldId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status) {
        ReportDataResponse response = reportService.getFieldReport(fieldId, dateFrom, dateTo, status);
        return ResponseEntity.ok(response);
    }

    // ==================== EXPORT ENDPOINTS ====================

    @GetMapping("/export/pdf/{reportType}")
    public ResponseEntity<byte[]> exportPdf(@PathVariable String reportType, Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long churchId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long fieldId) {
        User user = principal != null ? userRepository.findByEmail(principal.getName()).orElse(null) : null;
        Long userId = user != null ? user.getId() : null;
        String role = user != null && user.getRole() != null ? user.getRole().name() : "ADMIN";
        Long[] scopedIds = resolveScopedIds(user, role, reportType, churchId, districtId, fieldId);
        byte[] data = reportService.generatePdfReport(reportType, userId, role, dateFrom, dateTo, status, scopedIds[0], scopedIds[1], scopedIds[2]);
        logReportGeneration(reportType, principal, "dateFrom=" + dateFrom + ",dateTo=" + dateTo + ",status=" + status, "PDF", data.length);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + reportType + ".pdf").contentType(MediaType.APPLICATION_PDF).body(data);
    }

    @GetMapping("/export/excel/{reportType}")
    public ResponseEntity<byte[]> exportExcel(@PathVariable String reportType, Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long churchId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long fieldId) {
        User user = principal != null ? userRepository.findByEmail(principal.getName()).orElse(null) : null;
        Long userId = user != null ? user.getId() : null;
        String role = user != null && user.getRole() != null ? user.getRole().name() : "ADMIN";
        Long[] scopedIds = resolveScopedIds(user, role, reportType, churchId, districtId, fieldId);
        byte[] data = reportService.generateExcelReport(reportType, userId, role, dateFrom, dateTo, status, scopedIds[0], scopedIds[1], scopedIds[2]);
        logReportGeneration(reportType, principal, "dateFrom=" + dateFrom + ",dateTo=" + dateTo + ",status=" + status, "EXCEL", data.length);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + reportType + ".xlsx").contentType(MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).body(data);
    }

    private Long[] resolveScopedIds(User user, String role, String reportType, Long churchId, Long districtId, Long fieldId) {
        if (user == null) return new Long[]{churchId, districtId, fieldId};
        switch (role) {
            case "PASTOR":
            case "FIRST_CHURCH_ELDER":
                if (churchId == null && user.getChurch() != null) churchId = user.getChurch().getId();
                break;
            case "HEAD_OF_DISTRICT":
                if (districtId == null && user.getDistrict() != null) districtId = user.getDistrict().getId();
                if (churchId == null && user.getChurch() != null) churchId = user.getChurch().getId();
                break;
            case "HEAD_OF_FIELD":
                if (fieldId == null && user.getField() != null) fieldId = user.getField().getId();
                if (districtId == null && user.getDistrict() != null) districtId = user.getDistrict().getId();
                if (churchId == null && user.getChurch() != null) churchId = user.getChurch().getId();
                break;
            case "HEAD_OF_RUM":
                if (fieldId == null && user.getField() != null) fieldId = user.getField().getId();
                if (districtId == null && user.getDistrict() != null) districtId = user.getDistrict().getId();
                if (churchId == null && user.getChurch() != null) churchId = user.getChurch().getId();
                break;
            default:
                break;
        }
        return new Long[]{churchId, districtId, fieldId};
    }

    // ==================== HELPER ====================

    private void logReportGeneration(String reportName, Principal principal, String filters, String format, Integer recordCount) {
        try {
            ReportAuditLog log = new ReportAuditLog();
            log.setReportName(reportName);
            log.setGeneratedBy(principal != null ? principal.getName() : "SYSTEM");
            log.setGenerationDate(LocalDateTime.now());
            log.setFiltersUsed(filters);
            log.setFormat(format);
            log.setRecordCount(recordCount);
            if (principal != null) {
                userRepository.findByEmail(principal.getName()).ifPresent(user -> {
                    log.setGeneratedByName(user.getFullName());
                    log.setGeneratedByRole(user.getRole() != null ? user.getRole().name() : null);
                });
            }
            auditLogRepository.save(log);
        } catch (Exception ignored) {
        }
    }
}
