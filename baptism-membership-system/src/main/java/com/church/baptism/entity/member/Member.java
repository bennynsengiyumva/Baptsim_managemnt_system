package com.church.baptism.entity.member;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.department.Department;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "members")
public class Member extends AuditableEntity {

    @OneToOne
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;

    private LocalDate baptismDate;

    private String localChurch;

    @ManyToMany
    @JoinTable(
        name = "member_departments",
        joinColumns = @JoinColumn(name = "member_id"),
        inverseJoinColumns = @JoinColumn(name = "department_id")
    )
    private Set<Department> departments = new HashSet<>();

    private String leadershipRole;

    @Enumerated(EnumType.STRING)
    private MemberStatus status = MemberStatus.ACTIVE;

    private String transferHistory;

    private String pastoralNotes;

    public enum MemberStatus {
        ACTIVE,
        INACTIVE,
        TRANSFERRED,
        DECEASED
    }

    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }

    public LocalDate getBaptismDate() { return baptismDate; }
    public void setBaptismDate(LocalDate baptismDate) { this.baptismDate = baptismDate; }

    public String getLocalChurch() { return localChurch; }
    public void setLocalChurch(String localChurch) { this.localChurch = localChurch; }

    public Set<Department> getDepartments() { return departments; }
    public void setDepartments(Set<Department> departments) { this.departments = departments; }

    public String getLeadershipRole() { return leadershipRole; }
    public void setLeadershipRole(String leadershipRole) { this.leadershipRole = leadershipRole; }

    public MemberStatus getStatus() { return status; }
    public void setStatus(MemberStatus status) { this.status = status; }

    public String getTransferHistory() { return transferHistory; }
    public void setTransferHistory(String transferHistory) { this.transferHistory = transferHistory; }

    public String getPastoralNotes() { return pastoralNotes; }
    public void setPastoralNotes(String pastoralNotes) { this.pastoralNotes = pastoralNotes; }
}
