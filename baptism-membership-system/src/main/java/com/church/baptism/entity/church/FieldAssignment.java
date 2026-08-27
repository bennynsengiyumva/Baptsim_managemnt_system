package com.church.baptism.entity.church;

import com.church.baptism.entity.base.BaseEntity;
import com.church.baptism.entity.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "field_assignments")
public class FieldAssignment extends BaseEntity {

    public enum AssignmentStatus { ACTIVE, ENDED }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "field_id", nullable = false)
    private ChurchField field;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "head_id", nullable = false)
    private User head;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status = AssignmentStatus.ACTIVE;

    @Column(name = "reason")
    private String reason;

    @Column(name = "performed_by")
    private String performedBy;

    public ChurchField getField() { return field; }
    public void setField(ChurchField field) { this.field = field; }

    public User getHead() { return head; }
    public void setHead(User head) { this.head = head; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public AssignmentStatus getStatus() { return status; }
    public void setStatus(AssignmentStatus status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
}
