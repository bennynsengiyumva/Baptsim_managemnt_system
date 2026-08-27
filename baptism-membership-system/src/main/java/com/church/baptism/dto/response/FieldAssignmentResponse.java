package com.church.baptism.dto.response;

import java.time.LocalDate;

public class FieldAssignmentResponse {
    private Long id;
    private Long fieldId;
    private String fieldName;
    private Long headId;
    private String headName;
    private String headEmail;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String reason;
    private String performedBy;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFieldId() { return fieldId; }
    public void setFieldId(Long fieldId) { this.fieldId = fieldId; }

    public String getFieldName() { return fieldName; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }

    public Long getHeadId() { return headId; }
    public void setHeadId(Long headId) { this.headId = headId; }

    public String getHeadName() { return headName; }
    public void setHeadName(String headName) { this.headName = headName; }

    public String getHeadEmail() { return headEmail; }
    public void setHeadEmail(String headEmail) { this.headEmail = headEmail; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
}
