package com.church.baptism.dto.request.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EscalationRequest {
    @NotNull(message = "Chat ID is required")
    private Long chatId;

    @NotBlank(message = "Recipient role is required")
    private String recipientRole;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Message is required")
    private String message;
}
