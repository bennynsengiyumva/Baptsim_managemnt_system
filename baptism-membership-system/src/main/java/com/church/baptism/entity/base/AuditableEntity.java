package com.church.baptism.entity.base;

import jakarta.persistence.MappedSuperclass;

@MappedSuperclass
public abstract class AuditableEntity extends BaseEntity {

    private String createdBy;
    private String updatedBy;

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}