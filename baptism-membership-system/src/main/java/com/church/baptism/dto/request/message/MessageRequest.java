package com.church.baptism.dto.request.message;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageRequest {
    private Long receiverId;
    private String subject;
    private String content;
}
