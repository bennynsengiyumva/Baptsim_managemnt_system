package com.church.baptism.dto.response.ai;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class HumanSupportMessageResponse {
    private Long id;
    private Long candidateId;
    private String candidateName;
    private String recipientName;
    private String recipientRole;
    private String subject;
    private String message;
    private String status;
    private LocalDateTime createdAt;
    private boolean readByRecipient;
    private boolean readByCandidate;
    private boolean isReply;
    private Long parentId;
    private List<HumanSupportMessageResponse> replies;
    private String senderName;
}
