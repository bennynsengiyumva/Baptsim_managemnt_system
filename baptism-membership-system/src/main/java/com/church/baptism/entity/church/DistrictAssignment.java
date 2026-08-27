package com.church.baptism.entity.church;

import com.church.baptism.entity.base.BaseEntity;
import com.church.baptism.entity.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "district_assignments")
public class DistrictAssignment extends BaseEntity {

    public enum AssignmentStatus { ACTIVE, TRANSFERRED, ENDED }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pastor_id", nullable = false)
    private User pastor;

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

    public District getDistrict() { return district; }
    public void setDistrict(District district) { this.district = district; }

    public User getPastor() { return pastor; }
    public void setPastor(User pastor) { this.pastor = pastor; }

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
