package com.church.baptism.repository.notification;

import com.church.baptism.entity.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);
}