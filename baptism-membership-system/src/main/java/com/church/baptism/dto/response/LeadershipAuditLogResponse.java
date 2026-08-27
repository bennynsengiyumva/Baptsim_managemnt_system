package com.church.baptism.dto.response;

import java.time.LocalDateTime;

public class LeadershipAuditLogResponse {
    private Long id;
    private String eventType;
    private Long leaderId;
    private String leaderName;
    private Long previousAssignmentId;
    private String previousAssignmentSummary;
    private Long newAssignmentId;
    private String newAssignmentSummary;
    private Long districtId;
    private String districtName;
    private Long fieldId;
    private String fieldName;
    private String performedBy;
    private String reason;
    private LocalDateTime eventDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public Long getLeaderId() { return leaderId; }
    public void setLeaderId(Long leaderId) { this.leaderId = leaderId; }

    public String getLeaderName() { return leaderName; }
    public void setLeaderName(String leaderName) { this.leaderName = leaderName; }

    public Long getPreviousAssignmentId() { return previousAssignmentId; }
    public void setPreviousAssignmentId(Long previousAssignmentId) { this.previousAssignmentId = previousAssignmentId; }

    public String getPreviousAssignmentSummary() { return previousAssignmentSummary; }
    public void setPreviousAssignmentSummary(String previousAssignmentSummary) { this.previousAssignmentSummary = previousAssignmentSummary; }

    public Long getNewAssignmentId() { return newAssignmentId; }
    public void setNewAssignmentId(Long newAssignmentId) { this.newAssignmentId = newAssignmentId; }

    public String getNewAssignmentSummary() { return newAssignmentSummary; }
    public void setNewAssignmentSummary(String newAssignmentSummary) { this.newAssignmentSummary = newAssignmentSummary; }

    public Long getDistrictId() { return districtId; }
    public void setDistrictId(Long districtId) { this.districtId = districtId; }

    public String getDistrictName() { return districtName; }
    public void setDistrictName(String districtName) { this.districtName = districtName; }

    public Long getFieldId() { return fieldId; }
    public void setFieldId(Long fieldId) { this.fieldId = fieldId; }

    public String getFieldName() { return fieldName; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getEventDate() { return eventDate; }
    public void setEventDate(LocalDateTime eventDate) { this.eventDate = eventDate; }
}
