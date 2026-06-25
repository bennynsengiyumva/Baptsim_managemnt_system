package com.church.baptism.dto.dashboard;

public class DashboardStatsDTO {

    private long totalCandidates;
    private long activeCandidates;
    private long baptizedCandidates;
    private long pendingTransfers;

    private long totalChurches;
    private long totalInstructors;
    private long totalMembers;

    private double completionRate;

    public DashboardStatsDTO() {}

    public DashboardStatsDTO(
            long totalCandidates,
            long activeCandidates,
            long baptizedCandidates,
            long pendingTransfers,
            long totalChurches,
            long totalInstructors,
            long totalMembers,
            double completionRate
    ) {
        this.totalCandidates = totalCandidates;
        this.activeCandidates = activeCandidates;
        this.baptizedCandidates = baptizedCandidates;
        this.pendingTransfers = pendingTransfers;
        this.totalChurches = totalChurches;
        this.totalInstructors = totalInstructors;
        this.totalMembers = totalMembers;
        this.completionRate = completionRate;
    }

    // getters + setters

    public long getTotalCandidates() { return totalCandidates; }
    public void setTotalCandidates(long totalCandidates) { this.totalCandidates = totalCandidates; }

    public long getActiveCandidates() { return activeCandidates; }
    public void setActiveCandidates(long activeCandidates) { this.activeCandidates = activeCandidates; }

    public long getBaptizedCandidates() { return baptizedCandidates; }
    public void setBaptizedCandidates(long baptizedCandidates) { this.baptizedCandidates = baptizedCandidates; }

    public long getPendingTransfers() { return pendingTransfers; }
    public void setPendingTransfers(long pendingTransfers) { this.pendingTransfers = pendingTransfers; }

    public long getTotalChurches() { return totalChurches; }
    public void setTotalChurches(long totalChurches) { this.totalChurches = totalChurches; }

    public long getTotalInstructors() { return totalInstructors; }
    public void setTotalInstructors(long totalInstructors) { this.totalInstructors = totalInstructors; }

    public long getTotalMembers() { return totalMembers; }
    public void setTotalMembers(long totalMembers) { this.totalMembers = totalMembers; }

    public double getCompletionRate() { return completionRate; }
    public void setCompletionRate(double completionRate) { this.completionRate = completionRate; }
}