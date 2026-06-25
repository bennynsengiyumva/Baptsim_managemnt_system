package com.church.baptism.service.report;

import com.church.baptism.dto.response.ChurchDetailResponse;
import com.church.baptism.dto.response.ChurchFieldResponse;
import com.church.baptism.dto.response.ChurchResponse;
import com.church.baptism.dto.response.DashboardReportResponse;
import com.church.baptism.dto.response.DistrictResponse;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.spiritual.SpiritualPreparationRepository;
import com.church.baptism.service.church.ChurchFieldService;
import com.church.baptism.service.church.ChurchService;
import com.church.baptism.service.church.DistrictService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    public ReportService(
            CandidateRepository candidateRepository,
            LessonRepository lessonRepository,
            SpiritualPreparationRepository spiritualRepository,
            ChurchService churchService,
            DistrictService districtService,
            ChurchFieldService churchFieldService,
            ReportPdfService reportPdfService,
            ReportExcelService reportExcelService
    ) {
        this.candidateRepository = candidateRepository;
        this.lessonRepository = lessonRepository;
        this.spiritualRepository = spiritualRepository;
        this.churchService = churchService;
        this.districtService = districtService;
        this.churchFieldService = churchFieldService;
        this.reportPdfService = reportPdfService;
        this.reportExcelService = reportExcelService;
    }

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

        // ================= FIXED PART =================
        response.totalChurches = candidates.stream()
                .map(c -> c.getChurch().getId())   // ✔ FIX: NO more getLocalChurch()
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

    private String formatDateRange(LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom == null && dateTo == null) return "";
        StringBuilder sb = new StringBuilder();
        if (dateFrom != null) sb.append("From: ").append(dateFrom.format(DateTimeFormatter.ISO_LOCAL_DATE));
        if (dateFrom != null && dateTo != null) sb.append("  ");
        if (dateTo != null) sb.append("To: ").append(dateTo.format(DateTimeFormatter.ISO_LOCAL_DATE));
        return sb.toString();
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