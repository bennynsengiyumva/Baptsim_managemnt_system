package com.church.baptism.service.report;

import com.church.baptism.dto.response.*;
import com.church.baptism.entity.audit.AuthLog;
import com.church.baptism.entity.audit.CertificateDownloadLog;
import com.church.baptism.entity.audit.MessageLog;
import com.church.baptism.entity.audit.ReportAuditLog;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.baptism.BaptismEvent;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.entity.spiritual.SpiritualPreparation;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.audit.AuthLogRepository;
import com.church.baptism.repository.audit.CertificateDownloadLogRepository;
import com.church.baptism.repository.audit.MessageLogRepository;
import com.church.baptism.repository.audit.ReportAuditLogRepository;
import com.church.baptism.repository.baptism.BaptismEventRepository;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.spiritual.SpiritualPreparationRepository;
import com.church.baptism.service.church.ChurchFieldService;
import com.church.baptism.service.church.ChurchService;
import com.church.baptism.service.church.DistrictService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final CandidateRepository candidateRepository;
    private final LessonRepository lessonRepository;
    private final SpiritualPreparationRepository spiritualRepository;
    private final ChurchService churchService;
    private final DistrictService districtService;
    private final ChurchFieldService churchFieldService;
    private final ReportPdfService reportPdfService;
    private final ReportExcelService reportExcelService;
    private final BaptismRepository baptismRepository;
    private final BaptismEventRepository baptismEventRepository;
    private final InstructorRepository instructorRepository;
    private final AuthLogRepository authLogRepository;
    private final CertificateDownloadLogRepository certificateDownloadLogRepository;
    private final MessageLogRepository messageLogRepository;
    private final ReportAuditLogRepository reportAuditLogRepository;

    public ReportService(
            CandidateRepository candidateRepository,
            LessonRepository lessonRepository,
            SpiritualPreparationRepository spiritualRepository,
            ChurchService churchService,
            DistrictService districtService,
            ChurchFieldService churchFieldService,
            ReportPdfService reportPdfService,
            ReportExcelService reportExcelService,
            BaptismRepository baptismRepository,
            BaptismEventRepository baptismEventRepository,
            InstructorRepository instructorRepository,
            AuthLogRepository authLogRepository,
            CertificateDownloadLogRepository certificateDownloadLogRepository,
            MessageLogRepository messageLogRepository,
            ReportAuditLogRepository reportAuditLogRepository
    ) {
        this.candidateRepository = candidateRepository;
        this.lessonRepository = lessonRepository;
        this.spiritualRepository = spiritualRepository;
        this.churchService = churchService;
        this.districtService = districtService;
        this.churchFieldService = churchFieldService;
        this.reportPdfService = reportPdfService;
        this.reportExcelService = reportExcelService;
        this.baptismRepository = baptismRepository;
        this.baptismEventRepository = baptismEventRepository;
        this.instructorRepository = instructorRepository;
        this.authLogRepository = authLogRepository;
        this.certificateDownloadLogRepository = certificateDownloadLogRepository;
        this.messageLogRepository = messageLogRepository;
        this.reportAuditLogRepository = reportAuditLogRepository;
    }

    // ==================== EXISTING METHODS ====================

    public DashboardReportResponse getDashboardReport() {

        List<Candidate> candidates = candidateRepository.findAll();

        long totalCandidates = candidates.size();

        long baptized = candidates.stream()
                .filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED)
                .count();

        long active = candidates.stream()
                .filter(c -> c.getStatus() != Candidate.CandidateStatus.BAPTIZED)
                .count();

        List<Lesson> lessons = lessonRepository.findAll();

        long totalLessons = lessons.size();

        long completedLessons = lessons.stream()
                .filter(Lesson::isCompleted)
                .count();

        double baptismRate = totalCandidates == 0
                ? 0
                : (baptized * 100.0 / totalCandidates);

        double readinessRate = spiritualRepository.findAll()
                .stream()
                .mapToDouble(s -> s.getReadinessScore())
                .average()
                .orElse(0);

        DashboardReportResponse response = new DashboardReportResponse();

        response.totalCandidates = totalCandidates;
        response.baptizedCandidates = baptized;
        response.activeCandidates = active;

        response.totalLessons = totalLessons;
        response.completedLessons = completedLessons;

        response.baptismRate = baptismRate;
        response.readinessRate = readinessRate;

        response.totalChurches = candidates.stream()
                .map(c -> c.getChurch().getId())
                .distinct()
                .count();

        return response;
    }

    public byte[] generateChurchReport(Long churchId, LocalDate dateFrom, LocalDate dateTo, String format) {
        ChurchDetailResponse detail = churchService.getChurchDetail(churchId, dateFrom, dateTo);
        String dateRange = formatDateRange(dateFrom, dateTo);

        List<String> infoLines = new ArrayList<>();
        infoLines.add("Church: " + detail.getChurch().getChurchName());
        infoLines.add("District: " + detail.getChurch().getDistrictName());
        infoLines.add("Field: " + detail.getChurch().getFieldName());
        infoLines.add("Union: " + detail.getChurch().getUnionName());

        List<String> headers = List.of("#", "Candidate Name", "Status", "Baptism Date", "Created Date");
        List<List<String>> rows = buildCandidateRows(detail.getCandidates(), false, false);

        Map<String, Long> summary = buildSummary(detail.getProgress());

        if ("excel".equalsIgnoreCase(format)) {
            return reportExcelService.generateReport("Baptism Membership Report", infoLines, dateRange, headers, rows, summary);
        }
        return reportPdfService.generateReport("Baptism Membership Report", infoLines, dateRange, headers, rows, summary);
    }

    public byte[] generateDistrictReport(Long districtId, LocalDate dateFrom, LocalDate dateTo, String format) {
        DistrictResponse district = districtService.getById(districtId);
        String dateRange = formatDateRange(dateFrom, dateTo);

        List<ChurchResponse> churches = churchService.getChurchesByDistrict(districtId);
        List<ChurchDetailResponse> details = churches.stream()
                .map(c -> churchService.getChurchDetail(c.getId(), dateFrom, dateTo))
                .collect(Collectors.toList());

        List<String> infoLines = new ArrayList<>();
        infoLines.add("District: " + district.getName());
        infoLines.add("Field: " + district.getFieldName());

        List<String> headers = List.of("#", "Church", "Candidate Name", "Status", "Baptism Date", "Created Date");
        List<List<String>> rows = new ArrayList<>();
        int idx = 1;
        long total = 0, registered = 0, inProgress = 0, ready = 0, baptized = 0, future = 0;
        for (ChurchDetailResponse d : details) {
            String churchName = d.getChurch().getChurchName();
            for (ChurchDetailResponse.CandidateInfo c : d.getCandidates()) {
                rows.add(buildRow(idx++, c, churchName, null));
            }
            total += d.getProgress().getTotalCandidates();
            registered += d.getProgress().getRegistered();
            inProgress += d.getProgress().getInProgress();
            ready += d.getProgress().getReadyForBaptism();
            baptized += d.getProgress().getBaptized();
            future += d.getProgress().getFutureDated();
        }

        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("Total Candidates", total);
        summary.put("Registered", registered);
        summary.put("In Progress", inProgress);
        summary.put("Ready for Baptism", ready);
        summary.put("Baptized", baptized);
        summary.put("Future Dated", future);

        if ("excel".equalsIgnoreCase(format)) {
            return reportExcelService.generateReport("Baptism Membership Report - " + district.getName(), infoLines, dateRange, headers, rows, summary);
        }
        return reportPdfService.generateReport("Baptism Membership Report - " + district.getName(), infoLines, dateRange, headers, rows, summary);
    }

    public byte[] generateFieldReport(Long fieldId, LocalDate dateFrom, LocalDate dateTo, String format) {
        ChurchFieldResponse field = churchFieldService.getById(fieldId);
        String dateRange = formatDateRange(dateFrom, dateTo);

        List<DistrictResponse> districts = districtService.getByField(fieldId);
        List<ChurchDetailResponse> details = new ArrayList<>();
        for (DistrictResponse d : districts) {
            List<ChurchResponse> churches = churchService.getChurchesByDistrict(d.getId());
            for (ChurchResponse c : churches) {
                details.add(churchService.getChurchDetail(c.getId(), dateFrom, dateTo));
            }
        }

        List<String> infoLines = new ArrayList<>();
        infoLines.add("Field: " + field.getName());
        infoLines.add("Union: " + field.getUnionName());

        List<String> headers = List.of("#", "District", "Church", "Candidate Name", "Status", "Baptism Date", "Created Date");
        List<List<String>> rows = new ArrayList<>();
        int idx = 1;
        long total = 0, registered = 0, inProgress = 0, ready = 0, baptized = 0, future = 0;
        for (ChurchDetailResponse d : details) {
            String districtName = d.getChurch().getDistrictName();
            String churchName = d.getChurch().getChurchName();
            for (ChurchDetailResponse.CandidateInfo c : d.getCandidates()) {
                rows.add(buildRow(idx++, c, churchName, districtName));
            }
            total += d.getProgress().getTotalCandidates();
            registered += d.getProgress().getRegistered();
            inProgress += d.getProgress().getInProgress();
            ready += d.getProgress().getReadyForBaptism();
            baptized += d.getProgress().getBaptized();
            future += d.getProgress().getFutureDated();
        }

        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("Total Candidates", total);
        summary.put("Registered", registered);
        summary.put("In Progress", inProgress);
        summary.put("Ready for Baptism", ready);
        summary.put("Baptized", baptized);
        summary.put("Future Dated", future);

        if ("excel".equalsIgnoreCase(format)) {
            return reportExcelService.generateReport("Baptism Membership Report - " + field.getName(), infoLines, dateRange, headers, rows, summary);
        }
        return reportPdfService.generateReport("Baptism Membership Report - " + field.getName(), infoLines, dateRange, headers, rows, summary);
    }

    // ==================== CANDIDATE REPORTS ====================

    public ReportDataResponse getCandidateProgressReport(Long candidateId) {
        return getCandidateProgressReport(candidateId, null, null);
    }

    public ReportDataResponse getCandidateProgressReport(Long candidateId, LocalDate dateFrom, LocalDate dateTo) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        List<Lesson> lessons = lessonRepository.findByCandidateIdOrderByLessonOrderAsc(candidateId);
        List<SpiritualPreparation> spirituals = spiritualRepository.findByCandidateId(candidateId);

        long completed = lessons.stream().filter(Lesson::isCompleted).count();
        double avgScore = lessons.stream()
                .filter(Lesson::isCompleted)
                .mapToInt(Lesson::getObtainedScore)
                .average().orElse(0);
        double completionPct = lessons.isEmpty() ? 0 : (completed * 100.0 / lessons.size());
        double readiness = spirituals.stream()
                .mapToDouble(SpiritualPreparation::getReadinessScore)
                .average().orElse(0);

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Candidate Progress Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("Metric", "Value");
        response.records = List.of(
                Map.of("Metric", "Candidate", "Value", candidate.getFullName()),
                Map.of("Metric", "Status", "Value", candidate.getStatus().name()),
                Map.of("Metric", "Total Lessons", "Value", lessons.size()),
                Map.of("Metric", "Completed Lessons", "Value", completed),
                Map.of("Metric", "Completion %", "Value", String.format("%.1f%%", completionPct)),
                Map.of("Metric", "Average Score", "Value", String.format("%.1f", avgScore)),
                Map.of("Metric", "Readiness Score", "Value", String.format("%.1f", readiness)),
                Map.of("Metric", "Instructor Approved", "Value", candidate.isInstructorApproved() ? "Yes" : "No")
        );
        response.summary = Map.of(
                "totalLessons", lessons.size(),
                "completedLessons", completed,
                "completionPercentage", completionPct,
                "averageScore", avgScore,
                "readinessScore", readiness
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCandidateLessonsReport(Long candidateId) {
        return getCandidateLessonsReport(candidateId, null, null);
    }

    public ReportDataResponse getCandidateLessonsReport(Long candidateId, LocalDate dateFrom, LocalDate dateTo) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        List<Lesson> lessons = lessonRepository.findByCandidateIdOrderByLessonOrderAsc(candidateId);

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Candidate Lessons Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Lesson", "Date", "Status", "Score", "Required", "Completed At");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Lesson l : lessons) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Lesson", l.getLessonTitle() != null ? l.getLessonTitle() : "");
            record.put("Date", l.getLessonDate() != null ? l.getLessonDate().toString() : "");
            record.put("Status", l.getStatus().name());
            record.put("Score", l.getObtainedScore());
            record.put("Required", l.getRequiredScore());
            record.put("Completed At", l.getCompletedAt() != null ? l.getCompletedAt().toString() : "");
            response.records.add(record);
        }
        long completed = lessons.stream().filter(Lesson::isCompleted).count();
        response.summary = Map.of(
                "candidateName", candidate.getFullName(),
                "totalLessons", lessons.size(),
                "completed", completed,
                "pending", lessons.size() - completed
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCandidateBaptismStatusReport(Long candidateId) {
        return getCandidateBaptismStatusReport(candidateId, null, null);
    }

    public ReportDataResponse getCandidateBaptismStatusReport(Long candidateId, LocalDate dateFrom, LocalDate dateTo) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        List<Baptism> baptisms = baptismRepository.findByCandidateId(candidateId);

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Candidate Baptism Status Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("Baptism Date", "Location", "Status", "Certificate #", "Approved");
        response.records = new ArrayList<>();
        for (Baptism b : baptisms) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("Baptism Date", b.getBaptismDate() != null ? b.getBaptismDate().toString() : "");
            record.put("Location", b.getLocation() != null ? b.getLocation() : "");
            record.put("Status", b.getRequestStatus().name());
            record.put("Certificate #", b.getCertificateNumber() != null ? b.getCertificateNumber() : "");
            record.put("Approved", b.isApproved() ? "Yes" : "No");
            response.records.add(record);
        }
        response.summary = Map.of(
                "candidateName", candidate.getFullName(),
                "candidateStatus", candidate.getStatus().name(),
                "totalBaptismRecords", baptisms.size()
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCandidateCertificatesReport(Long candidateId) {
        return getCandidateCertificatesReport(candidateId, null, null);
    }

    public ReportDataResponse getCandidateCertificatesReport(Long candidateId, LocalDate dateFrom, LocalDate dateTo) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        List<Baptism> baptisms = baptismRepository.findByCandidateId(candidateId);
        List<Baptism> signed = baptisms.stream()
                .filter(Baptism::isCertificateSigned)
                .collect(Collectors.toList());
        List<Baptism> generated = baptisms.stream()
                .filter(b -> b.getCertificateNumber() != null)
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Candidate Certificates Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("Certificate #", "Baptism Date", "Signed", "Signed At", "Status");
        response.records = new ArrayList<>();
        for (Baptism b : baptisms) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("Certificate #", b.getCertificateNumber() != null ? b.getCertificateNumber() : "Not generated");
            record.put("Baptism Date", b.getBaptismDate() != null ? b.getBaptismDate().toString() : "");
            record.put("Signed", b.isCertificateSigned() ? "Yes" : "No");
            record.put("Signed At", b.getSignedAt() != null ? b.getSignedAt().toString() : "");
            record.put("Status", b.getRequestStatus().name());
            response.records.add(record);
        }
        response.summary = Map.of(
                "candidateName", candidate.getFullName(),
                "generated", generated.size(),
                "signed", signed.size(),
                "pending", generated.size() - signed.size()
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCandidateMembershipReport(Long candidateId) {
        return getCandidateMembershipReport(candidateId, null, null);
    }

    public ReportDataResponse getCandidateMembershipReport(Long candidateId, LocalDate dateFrom, LocalDate dateTo) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        List<Lesson> lessons = lessonRepository.findByCandidateId(candidateId);
        List<Baptism> baptisms = baptismRepository.findByCandidateId(candidateId);
        List<SpiritualPreparation> spirituals = spiritualRepository.findByCandidateId(candidateId);
        long completedLessons = lessons.stream().filter(Lesson::isCompleted).count();
        boolean baptized = baptisms.stream().anyMatch(Baptism::isBaptized);
        double readiness = spirituals.stream()
                .mapToDouble(SpiritualPreparation::getReadinessScore)
                .average().orElse(0);

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Candidate Membership Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("Field", "Value");
        response.records = List.of(
                Map.of("Field", "Full Name", "Value", candidate.getFullName()),
                Map.of("Field", "Email", "Value", candidate.getEmail() != null ? candidate.getEmail() : ""),
                Map.of("Field", "Phone", "Value", candidate.getPhone() != null ? candidate.getPhone() : ""),
                Map.of("Field", "Church", "Value", candidate.getChurch() != null ? candidate.getChurch().getChurchName() : ""),
                Map.of("Field", "Status", "Value", candidate.getStatus().name()),
                Map.of("Field", "Registration Date", "Value", candidate.getCreatedAt() != null ? candidate.getCreatedAt().toLocalDate().toString() : ""),
                Map.of("Field", "Baptism Date", "Value", candidate.getBaptismDate() != null ? candidate.getBaptismDate().toString() : ""),
                Map.of("Field", "Lessons Completed", "Value", completedLessons + "/" + lessons.size()),
                Map.of("Field", "Baptized", "Value", baptized ? "Yes" : "No"),
                Map.of("Field", "Readiness Score", "Value", String.format("%.1f", readiness))
        );
        response.summary = Map.of(
                "candidateStatus", candidate.getStatus().name(),
                "lessonsCompleted", completedLessons,
                "totalLessons", lessons.size(),
                "baptized", baptized,
                "readinessScore", readiness
        );
        response.totalRecords = response.records.size();
        return response;
    }

    // ==================== INSTRUCTOR REPORTS ====================

    public ReportDataResponse getAssignedCandidatesReport(Long instructorId) {
        return getAssignedCandidatesReport(instructorId, null, null);
    }

    public ReportDataResponse getAssignedCandidatesReport(Long instructorId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findByInstructorId(instructorId);
        Instructor instructor = instructorRepository.findById(instructorId)
                .orElse(null);

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Assigned Candidates Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Name", "Email", "Phone", "Church", "Status", "Approved");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : candidates) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Name", c.getFullName());
            record.put("Email", c.getEmail() != null ? c.getEmail() : "");
            record.put("Phone", c.getPhone() != null ? c.getPhone() : "");
            record.put("Church", c.getChurch() != null ? c.getChurch().getChurchName() : "");
            record.put("Status", c.getStatus().name());
            record.put("Approved", c.isInstructorApproved() ? "Yes" : "No");
            response.records.add(record);
        }
        long approved = candidates.stream().filter(Candidate::isInstructorApproved).count();
        response.summary = Map.of(
                "instructorName", instructor != null ? instructor.getFullName() : "",
                "totalAssigned", candidates.size(),
                "approved", approved,
                "pending", candidates.size() - approved
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCandidateProgressReportForInstructor(Long instructorId, Long candidateId) {
        return getCandidateProgressReportForInstructor(instructorId, candidateId, null, null);
    }

    public ReportDataResponse getCandidateProgressReportForInstructor(Long instructorId, Long candidateId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> assigned = candidateRepository.findByInstructorId(instructorId);

        if (candidateId != null) {
            boolean isAssigned = assigned.stream().anyMatch(c -> c.getId().equals(candidateId));
            if (!isAssigned) {
                throw new RuntimeException("Candidate is not assigned to this instructor");
            }
            return getCandidateProgressReport(candidateId, dateFrom, dateTo);
        }

        // Return progress for all assigned candidates
        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Candidate Progress Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Name", "Email", "Church", "Status", "Baptism Date", "Registered");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : assigned) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Name", c.getFullName());
            record.put("Email", c.getEmail() != null ? c.getEmail() : "-");
            record.put("Church", c.getChurch() != null ? c.getChurch().getChurchName() : "-");
            record.put("Status", c.getStatus() != null ? c.getStatus().name() : "-");
            record.put("Baptism Date", c.getBaptismDate() != null ? c.getBaptismDate().toString() : "-");
            record.put("Registered", c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate().toString() : "-");
            response.records.add(record);
        }
        long baptized = assigned.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
        long inProgress = assigned.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.IN_PROGRESS).count();
        long ready = assigned.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.READY_FOR_BAPTISM).count();
        response.summary = Map.of(
                "totalCandidates", assigned.size(),
                "baptized", baptized,
                "inProgress", inProgress,
                "ready", ready
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getLessonCompletionReport(Long instructorId) {
        return getLessonCompletionReport(instructorId, null, null);
    }

    public ReportDataResponse getLessonCompletionReport(Long instructorId, LocalDate dateFrom, LocalDate dateTo) {
        List<Lesson> lessons = lessonRepository.findByInstructorId(instructorId);
        Instructor instructor = instructorRepository.findById(instructorId).orElse(null);

        Map<Long, List<Lesson>> byCandidate = lessons.stream()
                .filter(l -> l.getCandidate() != null)
                .collect(Collectors.groupingBy(l -> l.getCandidate().getId()));

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Lesson Completion Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Candidate", "Total Lessons", "Completed", "Pending", "Completion %");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Map.Entry<Long, List<Lesson>> entry : byCandidate.entrySet()) {
            List<Lesson> cLessons = entry.getValue();
            long completed = cLessons.stream().filter(Lesson::isCompleted).count();
            double pct = cLessons.isEmpty() ? 0 : (completed * 100.0 / cLessons.size());
            Candidate c = cLessons.get(0).getCandidate();
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Candidate", c.getFullName());
            record.put("Total Lessons", cLessons.size());
            record.put("Completed", completed);
            record.put("Pending", cLessons.size() - completed);
            record.put("Completion %", String.format("%.1f%%", pct));
            response.records.add(record);
        }
        long totalCompleted = lessons.stream().filter(Lesson::isCompleted).count();
        response.summary = Map.of(
                "instructorName", instructor != null ? instructor.getFullName() : "",
                "totalCandidates", byCandidate.size(),
                "totalLessons", lessons.size(),
                "totalCompleted", totalCompleted,
                "overallCompletion", lessons.isEmpty() ? "0%" : String.format("%.1f%%", totalCompleted * 100.0 / lessons.size())
        );
        response.totalRecords = response.records.size();
        return response;
    }

    // ==================== ELDER REPORTS ====================

    public ReportDataResponse getBaptismRequestsReport(Long churchId) {
        return getBaptismRequestsReport(churchId, null, null);
    }

    public ReportDataResponse getBaptismRequestsReport(Long churchId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findByChurchId(churchId);
        List<Baptism> allBaptisms = candidates.stream()
                .flatMap(c -> baptismRepository.findByCandidateId(c.getId()).stream())
                .filter(b -> b.getRequestStatus() == Baptism.BaptismRequestStatus.PENDING)
                .filter(b -> isWithinDateRange(b.getRequestedAt() != null ? b.getRequestedAt().toLocalDate() : null, dateFrom, dateTo))
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Baptism Requests Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Candidate", "Baptism Date", "Requested At", "Status");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Baptism b : allBaptisms) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Candidate", b.getCandidate() != null ? b.getCandidate().getFullName() : "");
            record.put("Baptism Date", b.getBaptismDate() != null ? b.getBaptismDate().toString() : "");
            record.put("Requested At", b.getRequestedAt() != null ? b.getRequestedAt().toString() : "");
            record.put("Status", b.getRequestStatus().name());
            response.records.add(record);
        }
        response.summary = Map.of("totalPendingRequests", allBaptisms.size());
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getApprovedCandidatesReport(Long churchId) {
        return getApprovedCandidatesReport(churchId, null, null);
    }

    public ReportDataResponse getApprovedCandidatesReport(Long churchId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findByChurchId(churchId);
        List<Candidate> approved = candidates.stream()
                .filter(c -> c.getStatus() == Candidate.CandidateStatus.APPROVED_FOR_BAPTISM
                        || c.getStatus() == Candidate.CandidateStatus.READY_FOR_BAPTISM)
                .filter(c -> isWithinDateRange(c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate() : null, dateFrom, dateTo))
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Approved Candidates Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Name", "Email", "Phone", "Status", "Approved");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : approved) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Name", c.getFullName());
            record.put("Email", c.getEmail() != null ? c.getEmail() : "");
            record.put("Phone", c.getPhone() != null ? c.getPhone() : "");
            record.put("Status", c.getStatus().name());
            record.put("Approved", c.isInstructorApproved() ? "Yes" : "No");
            response.records.add(record);
        }
        response.summary = Map.of("totalApproved", approved.size());
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCandidatesReadyReport(Long churchId) {
        return getCandidatesReadyReport(churchId, null, null);
    }

    public ReportDataResponse getCandidatesReadyReport(Long churchId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findByChurchId(churchId);
        List<Candidate> ready = candidates.stream()
                .filter(c -> c.getStatus() == Candidate.CandidateStatus.READY_FOR_BAPTISM)
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Candidates Ready for Baptism Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Name", "Email", "Phone", "Status", "Baptism Date");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : ready) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Name", c.getFullName());
            record.put("Email", c.getEmail() != null ? c.getEmail() : "");
            record.put("Phone", c.getPhone() != null ? c.getPhone() : "");
            record.put("Status", c.getStatus().name());
            record.put("Baptism Date", c.getBaptismDate() != null ? c.getBaptismDate().toString() : "");
            response.records.add(record);
        }
        response.summary = Map.of("totalReady", ready.size());
        response.totalRecords = response.records.size();
        return response;
    }

    // ==================== PASTOR REPORTS ====================

    public ReportDataResponse getBaptismEventsReport(Long churchId) {
        return getBaptismEventsReport(churchId, null, null);
    }

    public ReportDataResponse getBaptismEventsReport(Long churchId, LocalDate dateFrom, LocalDate dateTo) {
        List<BaptismEvent> events = baptismEventRepository.findAllByOrderByEventDateDesc();

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Baptism Events Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Event Name", "Date", "Location", "Pastor", "Status", "Registrations");
        response.records = new ArrayList<>();
        int idx = 1;
        for (BaptismEvent e : events) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Event Name", e.getEventName());
            record.put("Date", e.getEventDate() != null ? e.getEventDate().toString() : "");
            record.put("Location", e.getLocation() != null ? e.getLocation() : "");
            record.put("Pastor", e.getOfficiatingPastor() != null ? e.getOfficiatingPastor() : "");
            record.put("Status", e.getStatus().name());
            record.put("Registrations", e.getRegistrations() != null ? e.getRegistrations().size() : 0);
            response.records.add(record);
        }
        long completed = events.stream().filter(e -> e.getStatus() == BaptismEvent.BaptismEventStatus.COMPLETED).count();
        response.summary = Map.of(
                "totalEvents", events.size(),
                "completed", completed,
                "planned", events.size() - completed
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getBaptizedCandidatesReport(Long churchId) {
        return getBaptizedCandidatesReport(churchId, null, null);
    }

    public ReportDataResponse getBaptizedCandidatesReport(Long churchId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findByChurchId(churchId);
        List<Candidate> baptized = candidates.stream()
                .filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED)
                .filter(c -> isWithinDateRange(c.getBaptismDate(), dateFrom, dateTo))
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Baptized Candidates Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Name", "Email", "Phone", "Baptism Date");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : baptized) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Name", c.getFullName());
            record.put("Email", c.getEmail() != null ? c.getEmail() : "");
            record.put("Phone", c.getPhone() != null ? c.getPhone() : "");
            record.put("Baptism Date", c.getBaptismDate() != null ? c.getBaptismDate().toString() : "");
            response.records.add(record);
        }
        response.summary = Map.of("totalBaptized", baptized.size());
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCertificateSigningReport(Long churchId) {
        return getCertificateSigningReport(churchId, null, null);
    }

    public ReportDataResponse getCertificateSigningReport(Long churchId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findByChurchId(churchId);
        List<Baptism> baptisms = candidates.stream()
                .flatMap(c -> baptismRepository.findByCandidateId(c.getId()).stream())
                .filter(b -> b.isBaptized() && !b.isCertificateSigned())
                .filter(b -> isWithinDateRange(b.getBaptismDate(), dateFrom, dateTo))
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Certificate Signing Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Candidate", "Certificate #", "Baptism Date", "Status");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Baptism b : baptisms) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Candidate", b.getCandidate() != null ? b.getCandidate().getFullName() : "");
            record.put("Certificate #", b.getCertificateNumber() != null ? b.getCertificateNumber() : "Pending");
            record.put("Baptism Date", b.getBaptismDate() != null ? b.getBaptismDate().toString() : "");
            record.put("Status", b.getRequestStatus().name());
            response.records.add(record);
        }
        response.summary = Map.of("pendingSigning", baptisms.size());
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCourseCompletionReport(Long churchId) {
        return getCourseCompletionReport(churchId, null, null);
    }

    public ReportDataResponse getCourseCompletionReport(Long churchId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findByChurchId(churchId);

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Course Completion Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Candidate", "Status", "Completed Lessons", "Total Lessons", "Completion %");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : candidates) {
            List<Lesson> lessons = lessonRepository.findByCandidateId(c.getId());
            long completed = lessons.stream().filter(Lesson::isCompleted).count();
            double pct = lessons.isEmpty() ? 0 : (completed * 100.0 / lessons.size());
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Candidate", c.getFullName());
            record.put("Status", c.getStatus().name());
            record.put("Completed Lessons", completed);
            record.put("Total Lessons", lessons.size());
            record.put("Completion %", String.format("%.1f%%", pct));
            response.records.add(record);
        }
        long totalCompleted = candidates.stream()
                .flatMap(c -> lessonRepository.findByCandidateId(c.getId()).stream())
                .filter(Lesson::isCompleted).count();
        long totalLessons = candidates.stream()
                .flatMap(c -> lessonRepository.findByCandidateId(c.getId()).stream())
                .count();
        response.summary = Map.of(
                "totalCandidates", candidates.size(),
                "totalCompletedLessons", totalCompleted,
                "totalLessons", totalLessons
        );
        response.totalRecords = response.records.size();
        return response;
    }

    // ==================== FIELD REPORTS ====================

    public ReportDataResponse getDistrictBaptismReport(Long fieldId) {
        return getDistrictBaptismReport(fieldId, null, null);
    }

    public ReportDataResponse getDistrictBaptismReport(Long fieldId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findAll();
        List<Candidate> fieldCandidates = candidates.stream()
                .filter(c -> c.getChurch() != null
                        && c.getChurch().getDistrict() != null
                        && c.getChurch().getDistrict().getField() != null
                        && c.getChurch().getDistrict().getField().getId().equals(fieldId))
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "District Baptism Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Candidate", "Church", "District", "Status", "Baptism Date");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : fieldCandidates) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Candidate", c.getFullName());
            record.put("Church", c.getChurch() != null ? c.getChurch().getChurchName() : "");
            record.put("District", c.getChurch() != null && c.getChurch().getDistrict() != null
                    ? c.getChurch().getDistrict().getName() : "");
            record.put("Status", c.getStatus().name());
            record.put("Baptism Date", c.getBaptismDate() != null ? c.getBaptismDate().toString() : "");
            response.records.add(record);
        }
        long baptized = fieldCandidates.stream()
                .filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
        response.summary = Map.of(
                "totalCandidates", fieldCandidates.size(),
                "baptized", baptized,
                "active", fieldCandidates.size() - baptized
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCertificateStatsReport(Long fieldId) {
        return getCertificateStatsReport(fieldId, null, null);
    }

    public ReportDataResponse getCertificateStatsReport(Long fieldId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findAll();
        List<Candidate> fieldCandidates = candidates.stream()
                .filter(c -> c.getChurch() != null
                        && c.getChurch().getDistrict() != null
                        && c.getChurch().getDistrict().getField() != null
                        && c.getChurch().getDistrict().getField().getId().equals(fieldId))
                .collect(Collectors.toList());
        List<Baptism> baptisms = fieldCandidates.stream()
                .flatMap(c -> baptismRepository.findByCandidateId(c.getId()).stream())
                .collect(Collectors.toList());

        long generated = baptisms.stream().filter(b -> b.getCertificateNumber() != null).count();
        long signed = baptisms.stream().filter(Baptism::isCertificateSigned).count();

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Certificate Stats Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Candidate", "Certificate #", "Baptism Date", "Signed");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Baptism b : baptisms) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Candidate", b.getCandidate() != null ? b.getCandidate().getFullName() : "");
            record.put("Certificate #", b.getCertificateNumber() != null ? b.getCertificateNumber() : "Not generated");
            record.put("Baptism Date", b.getBaptismDate() != null ? b.getBaptismDate().toString() : "");
            record.put("Signed", b.isCertificateSigned() ? "Yes" : "No");
            response.records.add(record);
        }
        response.summary = Map.of(
                "totalBaptisms", baptisms.size(),
                "certificatesGenerated", generated,
                "certificatesSigned", signed,
                "pendingSigning", generated - signed
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getInstructorActivityReport(Long fieldId) {
        return getInstructorActivityReport(fieldId, null, null);
    }

    public ReportDataResponse getInstructorActivityReport(Long fieldId, LocalDate dateFrom, LocalDate dateTo) {
        List<Instructor> instructors = instructorRepository.findByChurchId(fieldId);

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Instructor Activity Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Instructor", "Email", "Active", "Assigned Candidates", "Church");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Instructor i : instructors) {
            List<Candidate> assigned = candidateRepository.findByInstructorId(i.getId());
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Instructor", i.getFullName());
            record.put("Email", i.getEmail() != null ? i.getEmail() : "");
            record.put("Active", i.isActive() ? "Yes" : "No");
            record.put("Assigned Candidates", assigned.size());
            record.put("Church", i.getChurch() != null ? i.getChurch().getChurchName() : "");
            response.records.add(record);
        }
        long activeInstructors = instructors.stream().filter(Instructor::isActive).count();
        response.summary = Map.of(
                "totalInstructors", instructors.size(),
                "activeInstructors", activeInstructors
        );
        response.totalRecords = response.records.size();
        return response;
    }

    // ==================== RUM REPORTS ====================

    public ReportDataResponse getNationalBaptismReport(Long unionId) {
        return getNationalBaptismReport(unionId, null, null);
    }

    public ReportDataResponse getNationalBaptismReport(Long unionId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findAll();

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "National Baptism Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Candidate", "Church", "District", "Field", "Status", "Baptism Date");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : candidates) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Candidate", c.getFullName());
            record.put("Church", c.getChurch() != null ? c.getChurch().getChurchName() : "");
            record.put("District", c.getChurch() != null && c.getChurch().getDistrict() != null
                    ? c.getChurch().getDistrict().getName() : "");
            record.put("Field", c.getChurch() != null && c.getChurch().getDistrict() != null
                    && c.getChurch().getDistrict().getField() != null
                    ? c.getChurch().getDistrict().getField().getName() : "");
            record.put("Status", c.getStatus().name());
            record.put("Baptism Date", c.getBaptismDate() != null ? c.getBaptismDate().toString() : "");
            response.records.add(record);
        }
        long baptized = candidates.stream()
                .filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
        response.summary = Map.of(
                "totalCandidates", candidates.size(),
                "baptized", baptized,
                "active", candidates.size() - baptized
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getDistrictComparisonReport(Long unionId) {
        return getDistrictComparisonReport(unionId, null, null);
    }

    public ReportDataResponse getDistrictComparisonReport(Long unionId, LocalDate dateFrom, LocalDate dateTo) {
        List<Candidate> candidates = candidateRepository.findAll();

        Map<String, List<Candidate>> byDistrict = candidates.stream()
                .filter(c -> c.getChurch() != null && c.getChurch().getDistrict() != null)
                .collect(Collectors.groupingBy(c -> c.getChurch().getDistrict().getName()));

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "District Comparison Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "District", "Total Candidates", "Baptized", "Active", "Baptism Rate");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Map.Entry<String, List<Candidate>> entry : byDistrict.entrySet()) {
            List<Candidate> dCandidates = entry.getValue();
            long baptized = dCandidates.stream()
                    .filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
            double rate = dCandidates.isEmpty() ? 0 : baptized * 100.0 / dCandidates.size();
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("District", entry.getKey());
            record.put("Total Candidates", dCandidates.size());
            record.put("Baptized", baptized);
            record.put("Active", dCandidates.size() - baptized);
            record.put("Baptism Rate", String.format("%.1f%%", rate));
            response.records.add(record);
        }
        long totalBaptized = candidates.stream()
                .filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
        response.summary = Map.of(
                "totalDistricts", byDistrict.size(),
                "totalCandidates", candidates.size(),
                "totalBaptized", totalBaptized
        );
        response.totalRecords = response.records.size();
        return response;
    }

    // ==================== ADMIN REPORTS ====================

    public ReportDataResponse getUserActivityReport(LocalDate dateFrom, LocalDate dateTo) {
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime to = dateTo != null ? dateTo.atTime(LocalTime.MAX) : LocalDateTime.now();

        List<AuthLog> authLogs = authLogRepository.findAllByOrderByCreatedAtDesc();
        List<AuthLog> filtered = authLogs.stream()
                .filter(l -> l.getCreatedAt() != null
                        && !l.getCreatedAt().isBefore(from)
                        && !l.getCreatedAt().isAfter(to))
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "User Activity Report";
        response.generationDate = LocalDateTime.now();
        response.filters = new LinkedHashMap<>();
        if (dateFrom != null) response.filters.put("dateFrom", dateFrom.toString());
        if (dateTo != null) response.filters.put("dateTo", dateTo.toString());
        response.columnHeaders = List.of("#", "User Email", "Role", "Action", "IP Address", "Success", "Created At");
        response.records = new ArrayList<>();
        int idx = 1;
        for (AuthLog log : filtered) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("User Email", log.getUserEmail() != null ? log.getUserEmail() : "-");
            record.put("Role", log.getRole() != null ? log.getRole() : "-");
            record.put("Action", log.getAction() != null ? log.getAction() : "-");
            record.put("IP Address", log.getIpAddress() != null ? log.getIpAddress() : "-");
            record.put("Success", log.isSuccess() ? "Yes" : "No");
            record.put("Created At", log.getCreatedAt() != null ? log.getCreatedAt().toString() : "-");
            response.records.add(record);
        }
        long successes = filtered.stream().filter(AuthLog::isSuccess).count();
        Map<String, Long> byAction = filtered.stream()
                .collect(Collectors.groupingBy(AuthLog::getAction, Collectors.counting()));
        response.summary = Map.of(
                "totalActions", filtered.size(),
                "successes", successes,
                "failures", filtered.size() - successes,
                "uniqueActions", byAction.size()
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getAuthReport(LocalDate dateFrom, LocalDate dateTo) {
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime to = dateTo != null ? dateTo.atTime(LocalTime.MAX) : LocalDateTime.now();

        List<AuthLog> all = authLogRepository.findAllByOrderByCreatedAtDesc();
        List<AuthLog> filtered = all.stream()
                .filter(l -> l.getCreatedAt() != null
                        && !l.getCreatedAt().isBefore(from)
                        && !l.getCreatedAt().isAfter(to))
                .collect(Collectors.toList());

        long successes = filtered.stream().filter(AuthLog::isSuccess).count();
        long failures = filtered.size() - successes;
        Map<String, Long> byRole = filtered.stream()
                .filter(l -> l.getRole() != null)
                .collect(Collectors.groupingBy(AuthLog::getRole, Collectors.counting()));

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Authentication Report";
        response.generationDate = LocalDateTime.now();
        response.filters = new LinkedHashMap<>();
        if (dateFrom != null) response.filters.put("dateFrom", dateFrom.toString());
        if (dateTo != null) response.filters.put("dateTo", dateTo.toString());
        response.columnHeaders = List.of("#", "User Email", "Action", "Role", "Success", "Created At");
        response.records = new ArrayList<>();
        int idx = 1;
        for (AuthLog log : filtered) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("User Email", log.getUserEmail() != null ? log.getUserEmail() : "");
            record.put("Action", log.getAction() != null ? log.getAction() : "");
            record.put("Role", log.getRole() != null ? log.getRole() : "");
            record.put("Success", log.isSuccess() ? "Yes" : "No");
            record.put("Created At", log.getCreatedAt() != null ? log.getCreatedAt().toString() : "");
            response.records.add(record);
        }
        response.summary = Map.of(
                "totalAttempts", filtered.size(),
                "successes", successes,
                "failures", failures,
                "successRate", filtered.isEmpty() ? "0%" : String.format("%.1f%%", successes * 100.0 / filtered.size())
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getCertificateDownloadsReport(LocalDate dateFrom, LocalDate dateTo) {
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime to = dateTo != null ? dateTo.atTime(LocalTime.MAX) : LocalDateTime.now();

        List<CertificateDownloadLog> all = certificateDownloadLogRepository.findAllByOrderByCreatedAtDesc();
        List<CertificateDownloadLog> filtered = all.stream()
                .filter(l -> l.getCreatedAt() != null
                        && !l.getCreatedAt().isBefore(from)
                        && !l.getCreatedAt().isAfter(to))
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Certificate Downloads Report";
        response.generationDate = LocalDateTime.now();
        response.filters = new LinkedHashMap<>();
        if (dateFrom != null) response.filters.put("dateFrom", dateFrom.toString());
        if (dateTo != null) response.filters.put("dateTo", dateTo.toString());
        response.columnHeaders = List.of("#", "Candidate", "Certificate #", "Downloaded By", "Role", "Created At");
        response.records = new ArrayList<>();
        int idx = 1;
        for (CertificateDownloadLog log : filtered) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Candidate", log.getCandidateName() != null ? log.getCandidateName() : "");
            record.put("Certificate #", log.getCertificateNumber() != null ? log.getCertificateNumber() : "");
            record.put("Downloaded By", log.getDownloadedByName() != null ? log.getDownloadedByName() : "");
            record.put("Role", log.getRole() != null ? log.getRole() : "");
            record.put("Created At", log.getCreatedAt() != null ? log.getCreatedAt().toString() : "");
            response.records.add(record);
        }
        response.summary = Map.of("totalDownloads", filtered.size());
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getMessagingReport(LocalDate dateFrom, LocalDate dateTo) {
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime to = dateTo != null ? dateTo.atTime(LocalTime.MAX) : LocalDateTime.now();

        List<MessageLog> all = messageLogRepository.findAllByOrderByCreatedAtDesc();
        List<MessageLog> filtered = all.stream()
                .filter(l -> l.getCreatedAt() != null
                        && !l.getCreatedAt().isBefore(from)
                        && !l.getCreatedAt().isAfter(to))
                .collect(Collectors.toList());

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Messaging Report";
        response.generationDate = LocalDateTime.now();
        response.filters = new LinkedHashMap<>();
        if (dateFrom != null) response.filters.put("dateFrom", dateFrom.toString());
        if (dateTo != null) response.filters.put("dateTo", dateTo.toString());
        response.columnHeaders = List.of("#", "Sender", "Receiver", "Action", "Subject", "Created At");
        response.records = new ArrayList<>();
        int idx = 1;
        for (MessageLog log : filtered) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Sender", log.getSenderName() != null ? log.getSenderName() : "-");
            record.put("Receiver", log.getReceiverName() != null ? log.getReceiverName() : "-");
            record.put("Action", log.getAction() != null ? log.getAction() : "-");
            record.put("Subject", log.getSubject() != null ? log.getSubject() : "-");
            record.put("Created At", log.getCreatedAt() != null ? log.getCreatedAt().toString() : "-");
            response.records.add(record);
        }
        Map<String, Long> byAction = filtered.stream()
                .collect(Collectors.groupingBy(MessageLog::getAction, Collectors.counting()));
        response.summary = Map.of(
                "totalMessages", filtered.size(),
                "uniqueActions", byAction.size()
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getAuditLogsReport() {
        List<ReportAuditLog> logs = reportAuditLogRepository.findAllByOrderByGenerationDateDesc();
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
        return response;
    }

    // ==================== HIERARCHY REPORTS (Church/District/Field) ====================

    public ReportDataResponse getChurchReport(Long churchId, LocalDate dateFrom, LocalDate dateTo, String status) {
        List<Candidate> candidates = candidateRepository.findByChurchId(churchId);
        if (dateFrom != null || dateTo != null) {
            candidates = candidates.stream()
                    .filter(c -> isWithinDateRange(c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate() : null, dateFrom, dateTo))
                    .collect(Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            candidates = candidates.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus().name().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Church Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Name", "Email", "Church", "Status", "Baptism Date", "Registered");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : candidates) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Name", c.getFullName());
            record.put("Email", c.getEmail() != null ? c.getEmail() : "");
            record.put("Church", c.getChurch() != null ? c.getChurch().getChurchName() : "-");
            record.put("Status", c.getStatus() != null ? c.getStatus().name() : "");
            record.put("Baptism Date", c.getBaptismDate() != null ? c.getBaptismDate().toString() : "");
            record.put("Registered", c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate().toString() : "");
            response.records.add(record);
        }
        long baptized = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
        long inProgress = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.IN_PROGRESS).count();
        long registered = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.REGISTERED).count();
        long courseCompleted = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.COURSE_COMPLETED).count();
        response.summary = Map.of(
                "totalCandidates", candidates.size(),
                "registered", registered,
                "inProgress", inProgress,
                "courseCompleted", courseCompleted,
                "baptized", baptized
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getDistrictReport(Long districtId, LocalDate dateFrom, LocalDate dateTo, String status) {
        List<Candidate> candidates = candidateRepository.findByDistrictId(districtId);
        if (dateFrom != null || dateTo != null) {
            candidates = candidates.stream()
                    .filter(c -> isWithinDateRange(c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate() : null, dateFrom, dateTo))
                    .collect(Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            candidates = candidates.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus().name().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "District Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Name", "Email", "Church", "District", "Status", "Baptism Date", "Registered");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : candidates) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Name", c.getFullName());
            record.put("Email", c.getEmail() != null ? c.getEmail() : "");
            record.put("Church", c.getChurch() != null ? c.getChurch().getChurchName() : "-");
            record.put("District", c.getChurch() != null && c.getChurch().getDistrict() != null ? c.getChurch().getDistrict().getName() : "-");
            record.put("Status", c.getStatus() != null ? c.getStatus().name() : "");
            record.put("Baptism Date", c.getBaptismDate() != null ? c.getBaptismDate().toString() : "");
            record.put("Registered", c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate().toString() : "");
            response.records.add(record);
        }
        long baptized = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
        long inProgress = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.IN_PROGRESS).count();
        long registered = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.REGISTERED).count();
        long courseCompleted = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.COURSE_COMPLETED).count();
        response.summary = Map.of(
                "totalCandidates", candidates.size(),
                "registered", registered,
                "inProgress", inProgress,
                "courseCompleted", courseCompleted,
                "baptized", baptized
        );
        response.totalRecords = response.records.size();
        return response;
    }

    public ReportDataResponse getFieldReport(Long fieldId, LocalDate dateFrom, LocalDate dateTo, String status) {
        List<Candidate> candidates = candidateRepository.findByFieldId(fieldId);
        if (dateFrom != null || dateTo != null) {
            candidates = candidates.stream()
                    .filter(c -> isWithinDateRange(c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate() : null, dateFrom, dateTo))
                    .collect(Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            candidates = candidates.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus().name().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        ReportDataResponse response = new ReportDataResponse();
        response.reportName = "Field Report";
        response.generationDate = LocalDateTime.now();
        response.columnHeaders = List.of("#", "Name", "Email", "Church", "District", "Field", "Status", "Baptism Date", "Registered");
        response.records = new ArrayList<>();
        int idx = 1;
        for (Candidate c : candidates) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("#", idx++);
            record.put("Name", c.getFullName());
            record.put("Email", c.getEmail() != null ? c.getEmail() : "");
            record.put("Church", c.getChurch() != null ? c.getChurch().getChurchName() : "-");
            record.put("District", c.getChurch() != null && c.getChurch().getDistrict() != null ? c.getChurch().getDistrict().getName() : "-");
            record.put("Field", c.getChurch() != null && c.getChurch().getDistrict() != null && c.getChurch().getDistrict().getField() != null ? c.getChurch().getDistrict().getField().getName() : "-");
            record.put("Status", c.getStatus() != null ? c.getStatus().name() : "");
            record.put("Baptism Date", c.getBaptismDate() != null ? c.getBaptismDate().toString() : "");
            record.put("Registered", c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate().toString() : "");
            response.records.add(record);
        }
        long baptized = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
        long inProgress = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.IN_PROGRESS).count();
        long registered = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.REGISTERED).count();
        long courseCompleted = candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.COURSE_COMPLETED).count();
        response.summary = Map.of(
                "totalCandidates", candidates.size(),
                "registered", registered,
                "inProgress", inProgress,
                "courseCompleted", courseCompleted,
                "baptized", baptized
        );
        response.totalRecords = response.records.size();
        return response;
    }

    // ==================== PDF/EXCEL EXPORT ====================

    public byte[] generatePdfReport(String reportType, Long userId, String role,
                                     LocalDate dateFrom, LocalDate dateTo,
                                     String status, Long churchId, Long districtId, Long fieldId) {
        ReportDataResponse data = resolveReportData(reportType, userId, role, dateFrom, dateTo, status, churchId, districtId, fieldId);
        List<String> infoLines = new ArrayList<>();
        infoLines.add("Report: " + data.reportName);
        if (data.generatedByName != null) infoLines.add("Generated by: " + data.generatedByName);
        String dateRange = formatDateRange(dateFrom, dateTo);

        List<List<String>> rows = data.records.stream()
                .map(record -> data.columnHeaders.stream()
                        .map(h -> record.get(h) != null ? String.valueOf(record.get(h)) : "")
                        .collect(Collectors.toList()))
                .collect(Collectors.toList());

        Map<String, Long> summary = new LinkedHashMap<>();
        if (data.summary != null) {
            for (Map.Entry<String, Object> entry : data.summary.entrySet()) {
                if (entry.getValue() instanceof Number) {
                    summary.put(entry.getKey(), ((Number) entry.getValue()).longValue());
                } else {
                    summary.put(entry.getKey(), 0L);
                }
            }
        }

        return reportPdfService.generateReport(data.reportName, infoLines, dateRange, data.columnHeaders, rows, summary);
    }

    public byte[] generateExcelReport(String reportType, Long userId, String role,
                                       LocalDate dateFrom, LocalDate dateTo,
                                       String status, Long churchId, Long districtId, Long fieldId) {
        ReportDataResponse data = resolveReportData(reportType, userId, role, dateFrom, dateTo, status, churchId, districtId, fieldId);
        List<String> infoLines = new ArrayList<>();
        infoLines.add("Report: " + data.reportName);
        if (data.generatedByName != null) infoLines.add("Generated by: " + data.generatedByName);
        String dateRange = formatDateRange(dateFrom, dateTo);

        List<List<String>> rows = data.records.stream()
                .map(record -> data.columnHeaders.stream()
                        .map(h -> record.get(h) != null ? String.valueOf(record.get(h)) : "")
                        .collect(Collectors.toList()))
                .collect(Collectors.toList());

        Map<String, Long> summary = new LinkedHashMap<>();
        if (data.summary != null) {
            for (Map.Entry<String, Object> entry : data.summary.entrySet()) {
                if (entry.getValue() instanceof Number) {
                    summary.put(entry.getKey(), ((Number) entry.getValue()).longValue());
                } else {
                    summary.put(entry.getKey(), 0L);
                }
            }
        }

        return reportExcelService.generateReport(data.reportName, infoLines, dateRange, data.columnHeaders, rows, summary);
    }

    private ReportDataResponse resolveReportData(String reportType, Long userId, String role,
                                                  LocalDate dateFrom, LocalDate dateTo,
                                                  String status, Long churchId, Long districtId, Long fieldId) {
        switch (reportType.toLowerCase()) {
            case "candidate-progress":
                return getCandidateProgressReport(userId);
            case "candidate-lessons":
                return getCandidateLessonsReport(userId);
            case "candidate-baptism-status":
                return getCandidateBaptismStatusReport(userId);
            case "candidate-certificates":
                return getCandidateCertificatesReport(userId);
            case "candidate-membership":
                return getCandidateMembershipReport(userId);
            case "assigned-candidates":
                return getAssignedCandidatesReport(userId);
            case "lesson-completion":
                return getLessonCompletionReport(userId);
            case "baptism-requests":
                return getBaptismRequestsReport(churchId != null ? churchId : userId);
            case "approved-candidates":
                return getApprovedCandidatesReport(churchId != null ? churchId : userId);
            case "candidates-ready":
                return getCandidatesReadyReport(churchId != null ? churchId : userId);
            case "baptism-events":
                return getBaptismEventsReport(churchId != null ? churchId : userId);
            case "baptized-candidates":
                return getBaptizedCandidatesReport(churchId != null ? churchId : userId);
            case "certificate-signing":
                return getCertificateSigningReport(churchId != null ? churchId : userId);
            case "course-completion":
                return getCourseCompletionReport(churchId != null ? churchId : userId);
            case "district-baptism":
                return getDistrictBaptismReport(fieldId != null ? fieldId : userId);
            case "certificate-stats":
                return getCertificateStatsReport(fieldId != null ? fieldId : userId);
            case "instructor-activity":
                return getInstructorActivityReport(fieldId != null ? fieldId : userId);
            case "national-baptism":
                return getNationalBaptismReport(userId);
            case "district-comparison":
                return getDistrictComparisonReport(userId);
            case "user-activity":
                return getUserActivityReport(dateFrom, dateTo);
            case "auth-report":
                return getAuthReport(dateFrom, dateTo);
            case "certificate-downloads":
                return getCertificateDownloadsReport(dateFrom, dateTo);
            case "messaging-report":
                return getMessagingReport(dateFrom, dateTo);
            case "audit-logs":
                return getAuditLogsReport();
            case "church":
                return getChurchReport(churchId, dateFrom, dateTo, status);
            case "district":
                return getDistrictReport(districtId, dateFrom, dateTo, status);
            case "field":
                return getFieldReport(fieldId, dateFrom, dateTo, status);
            default:
                throw new RuntimeException("Unknown report type: " + reportType);
        }
    }

    // ==================== PRIVATE HELPERS ====================

    private String formatDateRange(LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom == null && dateTo == null) return "";
        StringBuilder sb = new StringBuilder();
        if (dateFrom != null) sb.append("From: ").append(dateFrom.format(DateTimeFormatter.ISO_LOCAL_DATE));
        if (dateFrom != null && dateTo != null) sb.append("  ");
        if (dateTo != null) sb.append("To: ").append(dateTo.format(DateTimeFormatter.ISO_LOCAL_DATE));
        return sb.toString();
    }

    private boolean isWithinDateRange(LocalDate date, LocalDate from, LocalDate to) {
        if (date == null) return true;
        if (from != null && date.isBefore(from)) return false;
        if (to != null && date.isAfter(to)) return false;
        return true;
    }

    private List<List<String>> buildCandidateRows(List<ChurchDetailResponse.CandidateInfo> candidates, boolean includeChurch, boolean includeDistrict) {
        List<List<String>> rows = new ArrayList<>();
        int idx = 1;
        for (ChurchDetailResponse.CandidateInfo c : candidates) {
            rows.add(buildRow(idx++, c, includeChurch ? "" : null, includeDistrict ? "" : null));
        }
        return rows;
    }

    private List<String> buildRow(int idx, ChurchDetailResponse.CandidateInfo c, String churchName, String districtName) {
        List<String> row = new ArrayList<>();
        row.add(String.valueOf(idx));
        if (districtName != null) row.add(districtName);
        if (churchName != null) row.add(churchName);
        row.add(c.getFullName());
        row.add(c.getStatus() != null ? c.getStatus() : "");
        row.add(c.getBaptismDate() != null ? c.getBaptismDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "");
        row.add(c.getCreatedAt() != null ? c.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "");
        return row;
    }

    private Map<String, Long> buildSummary(ChurchDetailResponse.ProgressInfo p) {
        Map<String, Long> s = new LinkedHashMap<>();
        s.put("Total Candidates", p.getTotalCandidates());
        s.put("Registered", p.getRegistered());
        s.put("In Progress", p.getInProgress());
        s.put("Ready for Baptism", p.getReadyForBaptism());
        s.put("Baptized", p.getBaptized());
        s.put("Future Dated", p.getFutureDated());
        return s;
    }
}
