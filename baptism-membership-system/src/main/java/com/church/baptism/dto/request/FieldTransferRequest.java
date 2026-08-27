package com.church.baptism.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class FieldTransferRequest {

    @NotNull(message = "Field ID is required")
    public Long fieldId;

    @NotNull(message = "New head ID is required")
    public Long newHeadId;

    @NotNull(message = "Effective date is required")
    public LocalDate effectiveDate;

    public String reason;

    public Long getFieldId() { return fieldId; }
    public void setFieldId(Long fieldId) { this.fieldId = fieldId; }

    public Long getNewHeadId() { return newHeadId; }
    public void setNewHeadId(Long newHeadId) { this.newHeadId = newHeadId; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
