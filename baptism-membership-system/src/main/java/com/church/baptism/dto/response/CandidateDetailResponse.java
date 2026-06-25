package com.church.baptism.dto.response;

import java.time.LocalDate;
import java.util.List;

public class CandidateDetailResponse {
    public Long id;
    public String fullName;
    public String email;
    public String phone;
    public String gender;
    public String address;
    public LocalDate dateOfBirth;
    public String status;

    public Long churchId;
    public String churchName;
    public Long instructorId;
    public String instructorName;
    public String instructorEmail;
    public String instructorPhone;

    public int totalLessons;
    public int completedLessons;
    public double progress;

    public boolean baptized;
    public boolean approved;
    public boolean certificateSigned;
    public String certificateNumber;
    public Long baptismId;

    public List<LessonGradeResponse> grades;
}
