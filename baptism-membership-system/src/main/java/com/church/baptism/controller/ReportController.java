package com.church.baptism.controller;

import com.church.baptism.service.church.ChurchFieldService;
import com.church.baptism.service.church.ChurchService;
import com.church.baptism.service.church.DistrictService;
import com.church.baptism.service.report.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final ChurchService churchService;
    private final DistrictService districtService;
    private final ChurchFieldService churchFieldService;

    public ReportController(
            ReportService reportService,
            ChurchService churchService,
            DistrictService districtService,
            ChurchFieldService churchFieldService
    ) {
        this.reportService = reportService;
        this.churchService = churchService;
        this.districtService = districtService;
        this.churchFieldService = churchFieldService;
    }

    @GetMapping("/church/{churchId}")
    public ResponseEntity<byte[]> generateChurchReport(
            @PathVariable Long churchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "pdf") String format
    ) {
        byte[] data = reportService.generateChurchReport(churchId, dateFrom, dateTo, format);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=church-report." + extension(format))
                .contentType(contentType(format))
                .body(data);
    }

    @GetMapping("/district/{districtId}")
    public ResponseEntity<byte[]> generateDistrictReport(
            @PathVariable Long districtId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "pdf") String format
    ) {
        byte[] data = reportService.generateDistrictReport(districtId, dateFrom, dateTo, format);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=district-report." + extension(format))
                .contentType(contentType(format))
                .body(data);
    }

    @GetMapping("/field/{fieldId}")
    public ResponseEntity<byte[]> generateFieldReport(
            @PathVariable Long fieldId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "pdf") String format
    ) {
        byte[] data = reportService.generateFieldReport(fieldId, dateFrom, dateTo, format);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=field-report." + extension(format))
                .contentType(contentType(format))
                .body(data);
    }

    private String extension(String format) {
        return "excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format) ? "xlsx" : "pdf";
    }

    private MediaType contentType(String format) {
        if ("excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format)) {
            return MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        }
        return MediaType.APPLICATION_PDF;
    }
}
