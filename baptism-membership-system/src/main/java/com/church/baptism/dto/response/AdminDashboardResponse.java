package com.church.baptism.dto.response;

public class AdminDashboardResponse {

    // ===== USERS / CANDIDATES =====
    public long totalCandidates;
    public long activeCandidates;
    public long readyForBaptism;

    // ===== LESSONS =====
    public double averageLessonCompletionRate;

    // ===== SPIRITUAL =====
    public double averageSpiritualReadiness;

    // ===== BAPTISM =====
    public long totalBaptisms;
    public long baptizedCandidates;
    public long pendingApprovals;

    // ===== GLOBAL READINESS =====
    public double overallReadinessRate;

    // ===== STATUS INSIGHT =====
    public String systemStatus; // Healthy / Growing / Needs Attention
}