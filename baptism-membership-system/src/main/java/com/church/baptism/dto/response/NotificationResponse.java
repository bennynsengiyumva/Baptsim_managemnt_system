package com.church.baptism.dto.response;

import java.time.LocalDateTime;

public class NotificationResponse {

    public Long id;

    public String title;

    public String message;

    public boolean isRead;

    public String type;

    public LocalDateTime createdAt;
}
