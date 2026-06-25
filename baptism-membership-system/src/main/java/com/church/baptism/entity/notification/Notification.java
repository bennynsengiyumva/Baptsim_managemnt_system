package com.church.baptism.entity.notification;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.user.User;
import jakarta.persistence.*;

@Entity
@Table(name = "notifications")
public class Notification extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String title;

    @Column(length = 3000)
    private String message;

    private boolean isRead = false;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    public enum NotificationType {
        INSTRUCTOR_ASSIGNED,
        NEW_LESSON,
        BAPTISM_EVENT_AVAILABLE,
        BAPTISM_REGISTERED,
        BAPTISM_CERTIFICATE_READY,
        CHURCH_ANNOUNCEMENT,
        LESSON_REMINDER,
        BAPTISM_APPROVAL,
        BAPTISM_SCHEDULE,
        SYSTEM,
        PROGRESS_UPDATE
    }

    public User getUser() {
        return user;
    }    public void setUser(User user) {
        this.user = user;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return isRead;
    }public void setRead(boolean read) {
        isRead = read;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }
}