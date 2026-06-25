package com.church.baptism.controller;

import com.church.baptism.dto.request.message.MessageRequest;
import com.church.baptism.dto.response.message.MessageResponse;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.message.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            Authentication authentication,
            @RequestBody MessageRequest request
    ) {
        User sender = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(messageService.sendMessage(sender.getId(), request));
    }

    @GetMapping("/inbox")
    public ResponseEntity<List<MessageResponse>> getInbox(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(messageService.getInbox(user.getId()));
    }

    @GetMapping("/sent")
    public ResponseEntity<List<MessageResponse>> getSent(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(messageService.getSentMessages(user.getId()));
    }

    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<MessageResponse>> getConversation(
            Authentication authentication,
            @PathVariable Long userId
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(messageService.getConversation(user.getId(), userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        messageService.markAsRead(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        long count = messageService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }
}
