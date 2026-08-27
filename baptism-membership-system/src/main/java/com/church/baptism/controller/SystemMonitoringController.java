package com.church.baptism.controller;

import com.church.baptism.service.system.SystemMonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemMonitoringController {

    private final SystemMonitoringService systemMonitoringService;

    public SystemMonitoringController(SystemMonitoringService systemMonitoringService) {
        this.systemMonitoringService = systemMonitoringService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(systemMonitoringService.getSystemStats());
    }
}
