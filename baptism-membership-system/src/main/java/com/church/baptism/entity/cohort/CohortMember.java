package com.church.baptism.entity.cohort;

import com.church.baptism.entity.candidate.Candidate;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cohort_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"cohort_id", "candidate_id"})
})
public class CohortMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cohort_id", nullable = false)
    private Cohort cohort;

    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Enumerated(EnumType.STRING)
    private EnrollmentStatus status = EnrollmentStatus.ENROLLED;

    private LocalDateTime enrolledAt;

    private LocalDateTime approvedAt;

    public enum EnrollmentStatus {
        ENROLLED,
        APPROVED,
        COMPLETED,
        WITHDRAWN
    }

    public Long getId() { return id; }
    public Cohort getCohort() { return cohort; }
    public void setCohort(Cohort cohort) { this.cohort = cohort; }
    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }
    public EnrollmentStatus getStatus() { return status; }
    public void setStatus(EnrollmentStatus status) { this.status = status; }
    public LocalDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(LocalDateTime enrolledAt) { this.enrolledAt = enrolledAt; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
}
