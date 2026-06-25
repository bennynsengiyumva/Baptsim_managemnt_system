package com.church.baptism.dto.response;

public class CandidateDashboardResponse {

    public Long candidateId;
    public String candidateName;

    public int totalLessons;
    public int completedLessons;
    public double lessonProgress;

    public int totalSpiritualActivities;
    public int readyActivities;
    public double spiritualProgress;

    public boolean readyForBaptism;
    public boolean baptized;
    public boolean approved;

    public double overallReadiness;

    public String statusMessage;
}