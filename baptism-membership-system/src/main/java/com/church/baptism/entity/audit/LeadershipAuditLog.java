package com.church.baptism.entity.audit;

import com.church.baptism.entity.base.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leadership_audit_logs")
public class LeadershipAuditLog extends BaseEntity {

    public enum EventType {
        HEAD_OF_DISTRICT_TRANSFERRED,
        HEAD_OF_DISTRICT_REASSIGNED,
        HEAD_OF_FIELD_REPLACED,
        HEAD_OF_FIELD_APPOINTED
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    @Column(name = "leader_id")
    private Long leaderId;

    @Column(name = "leader_name")
    private String leaderName;

    @Column(name = "previous_assignment_id")
    private Long previousAssignmentId;

    @Column(name = "previous_assignment_summary")
    private String previousAssignmentSummary;

    @Column(name = "new_assignment_id")
    private Long newAssignmentId;

    @Column(name = "new_assignment_summary")
    private String newAssignmentSummary;

    @Column(name = "district_id")
    private Long districtId;

    @Column(name = "district_name")
    private String districtName;

    @Column(name = "field_id")
    private Long fieldId;

    @Column(name = "field_name")
    private String fieldName;

    @Column(name = "performed_by")
    private String performedBy;

    @Column(name = "reason")
    private String reason;

    @Column(name = "event_date")
    private LocalDateTime eventDate;

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

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
