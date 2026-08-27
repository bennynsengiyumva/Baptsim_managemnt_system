package com.church.baptism.service.backup;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Stream;

@Service
public class BackupService {

    private static final Logger log = LoggerFactory.getLogger(BackupService.class);
    private static final DateTimeFormatter FILE_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/baptism}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:postgres}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Value("${backup.directory:backups}")
    private String backupDirectory;

    @Value("${backup.pg-dump-path:pg_dump}")
    private String pgDumpPath;

    @Value("${backup.days-to-keep:30}")
    private int defaultDaysToKeep;

    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduledBackup() {
        log.info("Starting scheduled daily backup...");
        performBackup();
        deleteOldBackups(defaultDaysToKeep);
    }

    public Map<String, Object> performBackup() {
        Map<String, Object> result = new LinkedHashMap<>();
        String timestamp = LocalDateTime.now().format(FILE_DATE_FORMAT);
        String filename = "baptism_backup_" + timestamp + ".sql";
        Path backupDir = Paths.get(backupDirectory);
        Path backupFile = backupDir.resolve(filename);

        try {
            Files.createDirectories(backupDir);

            String jdbcUrl = datasourceUrl;
            String dbName = extractDbName(jdbcUrl);
            String dbHost = extractDbHost(jdbcUrl);
            String dbPort = extractDbPort(jdbcUrl);

            ProcessBuilder pb = new ProcessBuilder(
                    pgDumpPath,
                    "-h", dbHost,
                    "-p", dbPort,
                    "-U", datasourceUsername,
                    "-d", dbName,
                    "-f", backupFile.toString(),
                    "--format=plain"
            );
            pb.environment().put("PGPASSWORD", datasourcePassword);
            pb.redirectErrorStream(true);

            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                long fileSize = Files.size(backupFile);
                result.put("success", true);
                result.put("filename", filename);
                result.put("path", backupFile.toString());
                result.put("size", fileSize);
                result.put("timestamp", LocalDateTime.now().toString());
                log.info("Backup completed successfully: {} ({} bytes)", filename, fileSize);
            } else {
                String errorOutput = new String(process.getInputStream().readAllBytes());
                result.put("success", false);
                result.put("error", "pg_dump exited with code " + exitCode + ": " + errorOutput);
                log.error("Backup failed: {}", errorOutput);
            }
        } catch (IOException | InterruptedException e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            log.error("Backup failed with exception", e);
            Thread.currentThread().interrupt();
        }

        return result;
    }

    public List<Map<String, Object>> getBackupHistory() {
        List<Map<String, Object> > backups = new ArrayList<>();
        Path backupDir = Paths.get(backupDirectory);

        if (!Files.exists(backupDir)) {
            return backups;
        }

        try (Stream<Path> files = Files.list(backupDir)) {
            files.filter(p -> p.toString().endsWith(".sql"))
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        Map<String, Object> info = new LinkedHashMap<>();
                        info.put("filename", path.getFileName().toString());
                        try {
                            info.put("size", Files.size(path));
                            info.put("lastModified", LocalDateTime.ofInstant(
                                    Files.getLastModifiedTime(path).toInstant(), ZoneId.systemDefault()
                            ).toString());
                        } catch (IOException e) {
                            info.put("size", 0);
                            info.put("lastModified", "unknown");
                        }
                        backups.add(info);
                    });
        } catch (IOException e) {
            log.error("Failed to list backup files", e);
        }

        return backups;
    }

    public boolean deleteBackup(String filename) {
        Path backupDir = Paths.get(backupDirectory);
        Path backupFile = backupDir.resolve(filename);

        if (!backupFile.startsWith(backupDir) || !Files.exists(backupFile)) {
            return false;
        }

        try {
            Files.delete(backupFile);
            log.info("Deleted backup: {}", filename);
            return true;
        } catch (IOException e) {
            log.error("Failed to delete backup: {}", filename, e);
            return false;
        }
    }

    public void deleteOldBackups(int daysToKeep) {
        Path backupDir = Paths.get(backupDirectory);
        if (!Files.exists(backupDir)) {
            return;
        }

        Instant cutoff = Instant.now().minus(java.time.Duration.ofDays(daysToKeep));

        try (Stream<Path> files = Files.list(backupDir)) {
            files.filter(p -> p.toString().endsWith(".sql"))
                    .forEach(path -> {
                        try {
                            Instant lastModified = Files.getLastModifiedTime(path).toInstant();
                            if (lastModified.isBefore(cutoff)) {
                                Files.delete(path);
                                log.info("Deleted old backup: {}", path.getFileName());
                            }
                        } catch (IOException e) {
                            log.error("Failed to delete old backup: {}", path.getFileName(), e);
                        }
                    });
        } catch (IOException e) {
            log.error("Failed to list backup directory for cleanup", e);
        }
    }

    private String extractDbName(String jdbcUrl) {
        String url = jdbcUrl.substring(jdbcUrl.lastIndexOf("/") + 1);
        int queryIndex = url.indexOf("?");
        return queryIndex > 0 ? url.substring(0, queryIndex) : url;
    }

    private String extractDbHost(String jdbcUrl) {
        String withoutProtocol = jdbcUrl.substring(jdbcUrl.indexOf("//") + 2);
        int colonIndex = withoutProtocol.indexOf(":");
        int slashIndex = withoutProtocol.indexOf("/");
        return withoutProtocol.substring(0, colonIndex > 0 ? colonIndex : slashIndex);
    }

    private String extractDbPort(String jdbcUrl) {
        String withoutProtocol = jdbcUrl.substring(jdbcUrl.indexOf("//") + 2);
        int colonIndex = withoutProtocol.indexOf(":");
        int slashIndex = withoutProtocol.indexOf("/");
        if (colonIndex > 0 && slashIndex > colonIndex) {
            return withoutProtocol.substring(colonIndex + 1, slashIndex);
        }
        return "5432";
    }
}
