package com.church.baptism.entity.audit;

import com.church.baptism.entity.base.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "report_audit_logs")
public class ReportAuditLog extends BaseEntity {

    @Column(name = "report_name", nullable = false)
    private String reportName;

    @Column(name = "generated_by", nullable = false)
    private String generatedBy;

    @Column(name = "generated_by_name")
    private String generatedByName;

    @Column(name = "generated_by_role")
    private String generatedByRole;

    @Column(name = "generation_date")
    private java.time.LocalDateTime generationDate;

    @Column(name = "filters_used", columnDefinition = "TEXT")
    private String filtersUsed;

    @Column(name = "format")
    private String format;

    @Column(name = "record_count")
    private Integer recordCount;

    public String getReportName() { return reportName; }
    public void setReportName(String reportName) { this.reportName = reportName; }

    public String getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(String generatedBy) { this.generatedBy = generatedBy; }

    public String getGeneratedByName() { return generatedByName; }
    public void setGeneratedByName(String generatedByName) { this.generatedByName = generatedByName; }

    public String getGeneratedByRole() { return generatedByRole; }
    public void setGeneratedByRole(String generatedByRole) { this.generatedByRole = generatedByRole; }

    public java.time.LocalDateTime getGenerationDate() { return generationDate; }
    public void setGenerationDate(java.time.LocalDateTime generationDate) { this.generationDate = generationDate; }

    public String getFiltersUsed() { return filtersUsed; }
    public void setFiltersUsed(String filtersUsed) { this.filtersUsed = filtersUsed; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public Integer getRecordCount() { return recordCount; }
    public void setRecordCount(Integer recordCount) { this.recordCount = recordCount; }
}
