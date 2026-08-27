package com.church.baptism.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class CandidateResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String gender;
    private String address;
    private LocalDate dateOfBirth;
    private String status;
    private boolean instructorApproved;
    private LocalDateTime createdAt;

    // Church — ✅ were missing
    private Long churchId;
    private String churchName;

    // Instructor — ✅ were missing (root cause of assignment never showing on frontend)
    private Long instructorId;
    private String instructorName;
    private String instructorEmail;
    private String instructorPhone;

    private String profilePicturePath;

    public CandidateResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isInstructorApproved() { return instructorApproved; }
    public void setInstructorApproved(boolean instructorApproved) { this.instructorApproved = instructorApproved; }

    public Long getChurchId() { return churchId; }
    public void setChurchId(Long churchId) { this.churchId = churchId; }

    public String getChurchName() { return churchName; }
    public void setChurchName(String churchName) { this.churchName = churchName; }

    public Long getInstructorId() { return instructorId; }
    public void setInstructorId(Long instructorId) { this.instructorId = instructorId; }

    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }

    public String getInstructorEmail() { return instructorEmail; }
    public void setInstructorEmail(String instructorEmail) { this.instructorEmail = instructorEmail; }

    public String getInstructorPhone() { return instructorPhone; }
    public void setInstructorPhone(String instructorPhone) { this.instructorPhone = instructorPhone; }

    public String getProfilePicturePath() { return profilePicturePath; }
    public void setProfilePicturePath(String profilePicturePath) { this.profilePicturePath = profilePicturePath; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}