package com.church.baptism.dto.response.ai;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AiChatMessageResponse {
    private Long id;
    private String role;
    private String content;
    private Boolean satisfied;
    private Boolean escalated;
    private LocalDateTime createdAt;
}
