package com.church.baptism.service.notification;

import com.church.baptism.dto.notification.NotificationMessage;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationWebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Send to all users
    public void sendGlobal(NotificationMessage message) {
        messagingTemplate.convertAndSend("/topic/global", message);
    }

    // Send to specific role (ADMIN, PASTOR, etc.)
    public void sendToRole(String role, NotificationMessage message) {
        messagingTemplate.convertAndSend("/topic/role/" + role, message);
    }

    // Send to specific user
    public void sendToUser(String email, NotificationMessage message) {
        messagingTemplate.convertAndSend("/queue/user/" + email, message);
    }
}