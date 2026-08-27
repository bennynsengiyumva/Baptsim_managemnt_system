package com.church.baptism.controller;

import com.church.baptism.dto.request.ai.ReplyRequest;
import com.church.baptism.dto.response.ai.HumanSupportMessageResponse;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.ai.SupportRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support-requests")
@RequiredArgsConstructor
@Tag(name = "Support Requests", description = "Human support request management")
public class SupportRequestController {

    private final SupportRequestService supportRequestService;
    private final UserRepository userRepository;

    @PostMapping("/reply")
    @Operation(summary = "Reply to a support request")
    public ResponseEntity<HumanSupportMessageResponse> reply(
            Authentication authentication,
            @Valid @RequestBody ReplyRequest request) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(supportRequestService.replyToRequest(user.getId(), request));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a support request as read")
    public ResponseEntity<Void> markAsRead(
            Authentication authentication,
            @PathVariable Long id) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        supportRequestService.markAsRead(user.getId(), id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/close")
    @Operation(summary = "Close a support request")
    public ResponseEntity<Void> closeRequest(
            Authentication authentication,
            @PathVariable Long id) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        supportRequestService.closeRequest(user.getId(), id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/recipient")
    @Operation(summary = "Get support requests for the logged-in recipient")
    public ResponseEntity<List<HumanSupportMessageResponse>> getRecipientRequests(
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(supportRequestService.getRecipientRequests(user.getId()));
    }

    @GetMapping("/candidate")
    @Operation(summary = "Get support requests for the logged-in candidate")
    public ResponseEntity<List<HumanSupportMessageResponse>> getCandidateRequests(
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(supportRequestService.getCandidateRequests(user.getId()));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread support request count for recipient")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(Map.of("count", supportRequestService.getUnreadCountForRecipient(user.getId())));
    }

    @GetMapping("/pending-count")
    @Operation(summary = "Get pending support request count for candidate")
    public ResponseEntity<Map<String, Long>> getPendingCount(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(Map.of("count", supportRequestService.getPendingCountForCandidate(user.getId())));
    }
}
