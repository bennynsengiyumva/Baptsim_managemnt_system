package com.church.baptism.entity.candidate;

import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.instructor.Instructor;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidates")
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String email;   // ✅ added — needed so CandidateService can store it and mapper can return it
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private String address;
    private String referralSource;
    private String profilePicturePath;

    private String preferredCourseLanguage = "en";

    @ManyToOne
    @JoinColumn(name = "church_id")
    private Church church;

    @ManyToOne
    @JoinColumn(name = "instructor_id")
    private Instructor instructor;

    @Enumerated(EnumType.STRING)
    private CandidateStatus status = CandidateStatus.REGISTERED;

    private boolean instructorApproved = false;

    private LocalDateTime createdAt;
    private LocalDate baptismDate;

    public enum CandidateStatus {
        REGISTERED,
        IN_PROGRESS,
        READY_FOR_BAPTISM,
        BAPTISM_REQUEST_PENDING,
        APPROVED_FOR_BAPTISM,
        BAPTIZED,
        CERTIFICATE_GENERATED,
        CERTIFICATE_SIGNED,
        COURSE_COMPLETED,
        TRANSFERRED_TO_CMS
    }

    // GETTERS & SETTERS

    public Long getId() { return id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getReferralSource() { return referralSource; }
    public void setReferralSource(String referralSource) { this.referralSource = referralSource; }

    public String getProfilePicturePath() { return profilePicturePath; }
    public void setProfilePicturePath(String profilePicturePath) { this.profilePicturePath = profilePicturePath; }

    public String getPreferredCourseLanguage() { return preferredCourseLanguage; }
    public void setPreferredCourseLanguage(String preferredCourseLanguage) { this.preferredCourseLanguage = preferredCourseLanguage; }

    public Church getChurch() { return church; }
    public void setChurch(Church church) { this.church = church; }

    public Instructor getInstructor() { return instructor; }
    public void setInstructor(Instructor instructor) { this.instructor = instructor; }

    public CandidateStatus getStatus() { return status; }
    public void setStatus(CandidateStatus status) { this.status = status; }

    public boolean isInstructorApproved() { return instructorApproved; }
    public void setInstructorApproved(boolean instructorApproved) { this.instructorApproved = instructorApproved; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDate getBaptismDate() { return baptismDate; }
    public void setBaptismDate(LocalDate baptismDate) { this.baptismDate = baptismDate; }
}