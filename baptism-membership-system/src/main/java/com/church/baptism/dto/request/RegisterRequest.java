package com.church.baptism.dto.request;

import com.church.baptism.entity.user.Role;
import java.time.LocalDate;

public class RegisterRequest {
    public String fullName;
    public String email;
    public String phone;
    public String password;
    public Role role;

    // Hierarchy assignment
    public Long unionId;
    public Long fieldId;
    public Long districtId;

    // Candidate-specific
    public LocalDate dateOfBirth;
    public String gender;
    public String address;
    public Long churchId;

    // Instructor-specific
    public String qualification;
    public int yearsOfService;
}