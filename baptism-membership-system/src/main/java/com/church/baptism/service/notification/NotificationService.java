package com.church.baptism.service.notification;

import com.church.baptism.dto.notification.NotificationMessage;
import com.church.baptism.dto.request.NotificationRequest;
import com.church.baptism.dto.response.NotificationResponse;
import com.church.baptism.entity.notification.Notification;
import com.church.baptism.entity.notification.Notification.NotificationType;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.notification.NotificationRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.auth.EmailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationWebSocketService webSocketService;

    public NotificationService(
            NotificationRepository repository,
            UserRepository userRepository,
            EmailService emailService,
            NotificationWebSocketService webSocketService
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.webSocketService = webSocketService;
    }

    @Transactional
    public NotificationResponse send(NotificationRequest request) {
        User user = userRepository.findById(request.userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return map(save(user, request.title, request.message, NotificationType.valueOf(request.type)));
    }

    @Transactional
    public NotificationResponse sendToUser(Long userId, String title, String message, NotificationType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Notification n = save(user, title, message, type);
        sendEmail(user, title, message);
        sendWebSocket(user, title, message, type);
        return map(n);
    }

    @Transactional
    public void sendToMultipleUsers(List<Long> userIds, String title, String message, NotificationType type) {
        List<User> users = userRepository.findAllById(userIds);
        for (User user : users) {
            save(user, title, message, type);
            sendEmail(user, title, message);
            sendWebSocket(user, title, message, type);
        }
    }

    @Transactional
    public void sendToAllByRole(String role, String title, String message, NotificationType type) {
        List<User> users = userRepository.findByRole(com.church.baptism.entity.user.Role.valueOf(role));
        for (User user : users) {
            save(user, title, message, type);
            sendEmail(user, title, message);
            sendWebSocket(user, title, message, type);
        }
    }

    public List<NotificationResponse> getUserNotifications(Long userId) {
        return repository.findByUserId(userId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = repository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        repository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = repository.findByUserId(userId);
        notifications.forEach(n -> n.setRead(true));
        repository.saveAll(notifications);
    }

    public long unreadCount(Long userId) {
        return repository.countByUserIdAndIsReadFalse(userId);
    }

    private Notification save(User user, String title, String message, NotificationType type) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        return repository.save(notification);
    }

    private void sendEmail(User user, String title, String message) {
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendNotification(user.getEmail(), title, message);
        }
    }

    private void sendWebSocket(User user, String title, String message, NotificationType type) {
        NotificationMessage wsMsg = new NotificationMessage();
        wsMsg.type = type.name();
        wsMsg.title = title;
        wsMsg.message = message;
        wsMsg.recipient = user.getEmail();
        webSocketService.sendToUser(user.getEmail(), wsMsg);
    }

    private NotificationResponse map(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.id = notification.getId();
        response.title = notification.getTitle();
        response.message = notification.getMessage();
        response.isRead = notification.isRead();
        response.type = notification.getType().name();
        response.createdAt = notification.getCreatedAt();
        return response;
    }
}
