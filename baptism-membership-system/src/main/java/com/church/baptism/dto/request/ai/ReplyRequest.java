package com.church.baptism.dto.request.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReplyRequest {
    @NotNull(message = "Support request ID is required")
    private Long supportRequestId;

    @NotBlank(message = "Message is required")
    private String message;
}
