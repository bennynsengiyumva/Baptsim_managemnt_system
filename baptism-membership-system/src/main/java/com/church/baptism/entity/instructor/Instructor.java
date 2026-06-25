package com.church.baptism.entity.instructor;

import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.candidate.Candidate;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "instructors")
public class Instructor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String email;
    private String phone;

    private int yearsOfService;
    private String qualification;

    private boolean active = true;

    // ================== RELATION: CHURCH ==================
    @ManyToOne
    @JoinColumn(name = "church_id", nullable = false)
    private Church church;

    // ================== RELATION: CANDIDATES ==================
    @OneToMany(mappedBy = "instructor")
    private List<Candidate> candidates;

    // GETTERS & SETTERS

    public Long getId() { return id; }

    public String getFullName() { return fullName; }

    public String getEmail() { return email; }

    public String getPhone() { return phone; }

    public int getYearsOfService() { return yearsOfService; }

    public String getQualification() { return qualification; }

    public boolean isActive() { return active; }

    public Church getChurch() { return church; }

    public List<Candidate> getCandidates() { return candidates; }

    public void setFullName(String fullName) { this.fullName = fullName; }

    public void setEmail(String email) { this.email = email; }

    public void setPhone(String phone) { this.phone = phone; }

    public void setYearsOfService(int yearsOfService) { this.yearsOfService = yearsOfService; }

    public void setQualification(String qualification) { this.qualification = qualification; }

    public void setActive(boolean active) { this.active = active; }

    public void setChurch(Church church) { this.church = church; }

    public void setCandidates(List<Candidate> candidates) { this.candidates = candidates; }
}