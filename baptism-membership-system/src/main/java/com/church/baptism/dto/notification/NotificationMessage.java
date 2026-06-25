package com.church.baptism.dto.notification;

public class NotificationMessage {

    public String type;      // INFO, WARNING, SUCCESS
    public String title;
    public String message;
    public String recipient; // role or user email
}