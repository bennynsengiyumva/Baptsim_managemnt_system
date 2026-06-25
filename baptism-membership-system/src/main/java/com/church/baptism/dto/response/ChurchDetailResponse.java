package com.church.baptism.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ChurchDetailResponse {
    private ChurchResponse church;
    private List<ElderInfo> elders;
    private InstructorInfo instructor;
    private List<CandidateInfo> candidates;
    private ProgressInfo progress;

    public ChurchResponse getChurch() { return church; }
    public void setChurch(ChurchResponse church) { this.church = church; }
    public List<ElderInfo> getElders() { return elders; }
    public void setElders(List<ElderInfo> elders) { this.elders = elders; }
    public InstructorInfo getInstructor() { return instructor; }
    public void setInstructor(InstructorInfo instructor) { this.instructor = instructor; }
    public List<CandidateInfo> getCandidates() { return candidates; }
    public void setCandidates(List<CandidateInfo> candidates) { this.candidates = candidates; }
    public ProgressInfo getProgress() { return progress; }
    public void setProgress(ProgressInfo progress) { this.progress = progress; }

    public static class ElderInfo {
        private Long id;
        private String fullName;
        private String email;
        private String phone;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }

    public static class InstructorInfo {
        private Long id;
        private String fullName;
        private String email;
        private String phone;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }

    public static class CandidateInfo {
        private Long id;
        private String fullName;
        private String email;
        private String status;
        private LocalDate baptismDate;
        private LocalDateTime createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDate getBaptismDate() { return baptismDate; }
        public void setBaptismDate(LocalDate baptismDate) { this.baptismDate = baptismDate; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class ProgressInfo {
        private long totalCandidates;
        private long registered;
        private long inProgress;
        private long readyForBaptism;
        private long baptized;
        private long futureDated;

        public long getTotalCandidates() { return totalCandidates; }
        public void setTotalCandidates(long totalCandidates) { this.totalCandidates = totalCandidates; }
        public long getRegistered() { return registered; }
        public void setRegistered(long registered) { this.registered = registered; }
        public long getInProgress() { return inProgress; }
        public void setInProgress(long inProgress) { this.inProgress = inProgress; }
        public long getReadyForBaptism() { return readyForBaptism; }
        public void setReadyForBaptism(long readyForBaptism) { this.readyForBaptism = readyForBaptism; }
        public long getBaptized() { return baptized; }
        public void setBaptized(long baptized) { this.baptized = baptized; }
        public long getFutureDated() { return futureDated; }
        public void setFutureDated(long futureDated) { this.futureDated = futureDated; }
    }
}
