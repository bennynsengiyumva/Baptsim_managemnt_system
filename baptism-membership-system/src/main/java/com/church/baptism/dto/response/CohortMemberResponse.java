package com.church.baptism.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CohortMemberResponse {
    private Long id;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String candidateStatus;
    private String enrollmentStatus;
    private LocalDateTime enrolledAt;
    private LocalDateTime approvedAt;
    private int completedLessons;
    private int totalLessons;
    private double progressPercentage;
}
