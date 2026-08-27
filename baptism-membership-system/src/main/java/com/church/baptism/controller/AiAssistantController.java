package com.church.baptism.controller;

import com.church.baptism.dto.request.ai.ChatRequest;
import com.church.baptism.dto.request.ai.EscalationRequest;
import com.church.baptism.dto.response.ai.AiChatResponse;
import com.church.baptism.dto.response.ai.HumanSupportMessageResponse;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.ai.AiAssistantService;
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
@RequestMapping("/api/ai-assistant")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "AI-powered help assistant for candidates")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;
    private final UserRepository userRepository;

    @PostMapping("/chat")
    @Operation(summary = "Start a new AI chat session")
    public ResponseEntity<AiChatResponse> startChat(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(aiAssistantService.startChat(user.getId()));
    }

    @PostMapping("/message")
    @Operation(summary = "Send a message to the AI assistant")
    public ResponseEntity<AiChatResponse> sendMessage(
            Authentication authentication,
            @Valid @RequestBody ChatRequest request) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(aiAssistantService.sendMessage(user.getId(), request));
    }

    @PostMapping("/feedback")
    @Operation(summary = "Provide satisfaction feedback on AI response")
    public ResponseEntity<AiChatResponse> satisfactionFeedback(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long chatId = Long.valueOf(body.get("chatId").toString());
        boolean satisfied = Boolean.TRUE.equals(body.get("satisfied"));
        return ResponseEntity.ok(aiAssistantService.satisfactionFeedback(user.getId(), chatId, satisfied));
    }

    @PostMapping("/escalate")
    @Operation(summary = "Escalate to human support (Instructor, Elder, or Pastor)")
    public ResponseEntity<HumanSupportMessageResponse> escalate(
            Authentication authentication,
            @Valid @RequestBody EscalationRequest request) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(aiAssistantService.escalate(user.getId(), request));
    }

    @GetMapping("/history")
    @Operation(summary = "Get AI chat history")
    public ResponseEntity<List<AiChatResponse>> getChatHistory(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(aiAssistantService.getChatHistory(user.getId()));
    }

    @GetMapping("/support-history")
    @Operation(summary = "Get human support message history")
    public ResponseEntity<List<HumanSupportMessageResponse>> getSupportHistory(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(aiAssistantService.getSupportHistory(user.getId()));
    }
}
