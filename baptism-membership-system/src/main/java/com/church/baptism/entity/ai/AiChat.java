package com.church.baptism.entity.ai;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ai_chats")
@Getter
@Setter
public class AiChat extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    private User candidate;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "message_count")
    private int messageCount = 0;
}
