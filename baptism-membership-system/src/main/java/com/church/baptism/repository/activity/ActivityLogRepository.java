package com.church.baptism.repository.activity;

import com.church.baptism.entity.activity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ActivityLog> findAllByOrderByCreatedAtDesc();
    List<ActivityLog> findByActionAndCreatedAtBetween(String action, LocalDateTime start, LocalDateTime end);
    long countByUserIdAndActionAndCreatedAtBetween(Long userId, String action, LocalDateTime start, LocalDateTime end);
    List<ActivityLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
}
