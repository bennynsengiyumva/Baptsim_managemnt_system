package com.church.baptism.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class DistrictTransferRequest {

    @NotNull(message = "District ID is required")
    public Long districtId;

    @NotNull(message = "New head (pastor) ID is required")
    public Long newHeadPastorId;

    @NotNull(message = "Effective date is required")
    public LocalDate effectiveDate;

    public String reason;

    public Long getDistrictId() { return districtId; }
    public void setDistrictId(Long districtId) { this.districtId = districtId; }

    public Long getNewHeadPastorId() { return newHeadPastorId; }
    public void setNewHeadPastorId(Long newHeadPastorId) { this.newHeadPastorId = newHeadPastorId; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
