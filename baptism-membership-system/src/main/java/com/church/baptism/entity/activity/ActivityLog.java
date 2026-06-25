package com.church.baptism.entity.activity;

import com.church.baptism.entity.base.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "activity_logs")
public class ActivityLog extends BaseEntity {

    @Column(nullable = false)
    private Long userId;

    private String userEmail;

    private String userName;

    @Column(nullable = false)
    private String action;

    @Column(length = 3000)
    private String details;

    private String ipAddress;

    private String entityType;

    private Long entityId;

    private boolean success = true;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
}
