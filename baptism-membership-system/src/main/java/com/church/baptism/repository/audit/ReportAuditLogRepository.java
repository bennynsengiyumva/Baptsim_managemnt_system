package com.church.baptism.repository.audit;

import com.church.baptism.entity.audit.ReportAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportAuditLogRepository extends JpaRepository<ReportAuditLog, Long> {
    List<ReportAuditLog> findByGeneratedByOrderByGenerationDateDesc(String generatedBy);
    List<ReportAuditLog> findAllByOrderByGenerationDateDesc();
}
