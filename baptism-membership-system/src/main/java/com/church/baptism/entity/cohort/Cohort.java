package com.church.baptism.entity.cohort;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.instructor.Instructor;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cohorts")
public class Cohort extends AuditableEntity {

    private String cohortName;

    @Column(unique = true)
    private String cohortCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String language = "en";

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer capacity;

    @Enumerated(EnumType.STRING)
    private CohortStatus status = CohortStatus.DRAFT;

    @ManyToOne
    @JoinColumn(name = "church_id")
    private Church church;

    @ManyToOne
    @JoinColumn(name = "instructor_id")
    private Instructor instructor;

    @OneToMany(mappedBy = "cohort", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CohortMember> members = new ArrayList<>();

    public enum CohortStatus {
        DRAFT,
        ACTIVE,
        COMPLETED,
        ARCHIVED,
        CANCELLED
    }

    public String getCohortName() { return cohortName; }
    public void setCohortName(String cohortName) { this.cohortName = cohortName; }
    public String getCohortCode() { return cohortCode; }
    public void setCohortCode(String cohortCode) { this.cohortCode = cohortCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public CohortStatus getStatus() { return status; }
    public void setStatus(CohortStatus status) { this.status = status; }
    public Church getChurch() { return church; }
    public void setChurch(Church church) { this.church = church; }
    public Instructor getInstructor() { return instructor; }
    public void setInstructor(Instructor instructor) { this.instructor = instructor; }
    public List<CohortMember> getMembers() { return members; }
    public void setMembers(List<CohortMember> members) { this.members = members; }
}
