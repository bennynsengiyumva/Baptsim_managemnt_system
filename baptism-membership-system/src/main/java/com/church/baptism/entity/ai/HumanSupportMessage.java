package com.church.baptism.entity.ai;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "human_support_messages")
@Getter
@Setter
public class HumanSupportMessage extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    private User candidate;

    @ManyToOne
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false)
    private String recipientRole;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 30)
    private String status = "WAITING_FOR_RESPONSE";

    @Column(name = "ai_chat_id")
    private Long aiChatId;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private HumanSupportMessage parent;

    @Column(name = "is_reply")
    private boolean reply = false;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender;

    @Column(name = "read_by_recipient")
    private boolean readByRecipient = false;

    @Column(name = "read_by_candidate")
    private boolean readByCandidate = false;
}
