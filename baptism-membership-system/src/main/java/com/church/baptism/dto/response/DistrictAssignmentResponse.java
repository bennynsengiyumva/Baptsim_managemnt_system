package com.church.baptism.dto.response;

import java.time.LocalDate;

public class DistrictAssignmentResponse {

    public Long id;
    public Long districtId;
    public String districtName;
    public Long pastorId;
    public String pastorName;
    public String pastorEmail;
    public LocalDate startDate;
    public LocalDate endDate;
    public String status;
    public String reason;
    public String performedBy;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDistrictId() { return districtId; }
    public void setDistrictId(Long districtId) { this.districtId = districtId; }

    public String getDistrictName() { return districtName; }
    public void setDistrictName(String districtName) { this.districtName = districtName; }

    public Long getPastorId() { return pastorId; }
    public void setPastorId(Long pastorId) { this.pastorId = pastorId; }

    public String getPastorName() { return pastorName; }
    public void setPastorName(String pastorName) { this.pastorName = pastorName; }

    public String getPastorEmail() { return pastorEmail; }
    public void setPastorEmail(String pastorEmail) { this.pastorEmail = pastorEmail; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
}
