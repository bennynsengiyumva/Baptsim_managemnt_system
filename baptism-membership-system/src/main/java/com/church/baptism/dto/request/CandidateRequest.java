package com.church.baptism.dto.request;

import java.time.LocalDate;

public class CandidateRequest {

    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private String address;
    private String referralSource;
    private String localChurch;
    private Long churchId;
    private String email;
    private String password;
    private Long instructorId; // ✅ added — needed for optional assignment at registration

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

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

    public String getLocalChurch() { return localChurch; }
    public void setLocalChurch(String localChurch) { this.localChurch = localChurch; }

    public Long getChurchId() { return churchId; }
    public void setChurchId(Long churchId) { this.churchId = churchId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Long getInstructorId() { return instructorId; }
    public void setInstructorId(Long instructorId) { this.instructorId = instructorId; }
}