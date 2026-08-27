package com.church.baptism.controller;

import com.church.baptism.service.backup.BackupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/system/backup")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> triggerBackup() {
        Map<String, Object> result = backupService.performBackup();
        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.internalServerError().body(result);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getBackupHistory() {
        return ResponseEntity.ok(backupService.getBackupHistory());
    }

    @DeleteMapping("/{filename}")
    public ResponseEntity<Map<String, String>> deleteBackup(@PathVariable String filename) {
        boolean deleted = backupService.deleteBackup(filename);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Backup deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}
