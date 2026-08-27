package com.church.baptism.entity.audit;

import com.church.baptism.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "auth_logs")
@Getter
@Setter
public class AuthLog extends BaseEntity {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "role")
    private String role;

    @Column(name = "action")
    private String action;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "device_info")
    private String deviceInfo;

    @Column(name = "details")
    private String details;

    @Column(name = "success")
    private boolean success = true;
}
