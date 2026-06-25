package com.church.baptism.dto.response;

public class InstructorResponse {

    public Long id;
    public String fullName;
    public String email;
    public String phone;
    public String qualification;
    public int yearsOfService;
    public boolean active;

    // ✅ Removed: `public String church` — was a stale unused field shadowing churchId/churchName
    public Long churchId;
    public String churchName;

    // ✅ Added: candidate count so frontend can show instructor workload at a glance
    public int candidateCount;
}