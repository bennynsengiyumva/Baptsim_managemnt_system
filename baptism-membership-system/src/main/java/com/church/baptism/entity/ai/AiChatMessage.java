package com.church.baptism.entity.ai;

import com.church.baptism.entity.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ai_chat_messages")
@Getter
@Setter
public class AiChatMessage extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "chat_id", nullable = false)
    private AiChat chat;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "satisfied")
    private Boolean satisfied;

    @Column(name = "escalated")
    private Boolean escalated = false;
}
