package com.church.baptism.entity.audit;

import com.church.baptism.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "message_logs")
@Getter
@Setter
public class MessageLog extends BaseEntity {

    @Column(name = "conversation_id")
    private String conversationId;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "receiver_id")
    private Long receiverId;

    @Column(name = "receiver_name")
    private String receiverName;

    @Column(name = "action")
    private String action;

    @Column(name = "subject")
    private String subject;

    @Column(name = "message_preview")
    private String messagePreview;
}
