package com.church.baptism.entity.message;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "messages")
@Getter
@Setter
public class Message extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private boolean read = false;

    @Column(length = 50)
    private String subject;
}
