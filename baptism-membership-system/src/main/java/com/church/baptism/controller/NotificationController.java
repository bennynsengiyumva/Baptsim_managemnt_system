package com.church.baptism.controller;

import com.church.baptism.dto.request.NotificationRequest;
import com.church.baptism.dto.response.NotificationResponse;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.notification.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;
    private final UserRepository userRepository;

    public NotificationController(NotificationService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @PostMapping
    public NotificationResponse send(@RequestBody NotificationRequest request) {
        return service.send(request);
    }

    @GetMapping("/user/{userId}")
    public List<NotificationResponse> getUserNotifications(@PathVariable Long userId) {
        return service.getUserNotifications(userId);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyNotifications(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.getUserNotifications(user.getId()));
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<Long> getUnreadCount(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.unreadCount(user.getId()));
    }

    @PutMapping("/{id}/read")
    public String markAsRead(@PathVariable Long id) {
        service.markAsRead(id);
        return "Notification marked as read";
    }

    @PutMapping("/me/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();
        service.markAllAsRead(user.getId());
        return ResponseEntity.ok("All notifications marked as read");
    }

    @GetMapping("/user/{userId}/unread-count")
    public long unreadCount(@PathVariable Long userId) {
        return service.unreadCount(userId);
    }
}
