package com.church.baptism.controller;

import com.church.baptism.entity.audit.AuthLog;
import com.church.baptism.entity.audit.CertificateDownloadLog;
import com.church.baptism.entity.audit.MessageLog;
import com.church.baptism.service.admin.AdminDashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin("*")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return adminDashboardService.getDashboardStats();
    }

    @GetMapping("/certificates")
    public List<Map<String, Object>> getAllCertificates() {
        return adminDashboardService.getAllCertificates();
    }

    @GetMapping("/certificate-downloads")
    public List<CertificateDownloadLog> getCertificateDownloads() {
        return adminDashboardService.getCertificateDownloads();
    }

    @GetMapping("/certificate-downloads/{baptismId}")
    public List<CertificateDownloadLog> getDownloadsByBaptism(@PathVariable Long baptismId) {
        return adminDashboardService.getDownloadsByBaptism(baptismId);
    }

    @GetMapping("/conversations")
    public List<Map<String, Object>> getConversationsOverview() {
        return adminDashboardService.getConversationsOverview();
    }

    @GetMapping("/message-logs")
    public List<MessageLog> getMessageLogs() {
        return adminDashboardService.getMessageLogs();
    }

    @GetMapping("/baptism-requests")
    public List<Map<String, Object>> getAllBaptismRequests() {
        return adminDashboardService.getAllBaptismRequests();
    }

    @GetMapping("/auth-logs")
    public List<AuthLog> getAuthLogs() {
        return adminDashboardService.getAuthLogs();
    }

    @GetMapping("/activity")
    public List<Map<String, Object>> getUserActivity() {
        return adminDashboardService.getUserActivity();
    }
}
