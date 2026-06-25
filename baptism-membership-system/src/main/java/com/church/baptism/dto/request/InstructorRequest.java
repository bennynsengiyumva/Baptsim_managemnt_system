package com.church.baptism.dto.request;

public class InstructorRequest {

    public String fullName;
    public String email;
    public String phone;

    // ✅ FIX: use ID, not String
    public Long churchId;

    public String qualification;
    public int yearsOfService;
    public String password;
}