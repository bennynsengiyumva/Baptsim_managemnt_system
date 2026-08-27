package com.church.baptism.dto.response.ai;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AiChatResponse {
    private Long id;
    private String title;
    private String status;
    private int messageCount;
    private LocalDateTime createdAt;
    private List<AiChatMessageResponse> messages;
}
