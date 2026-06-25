package com.church.baptism.service.activity;

import com.church.baptism.entity.activity.ActivityLog;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.activity.ActivityLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ActivityLogService {

    private final ActivityLogRepository repository;

    public ActivityLogService(ActivityLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void log(User user, String action, String details, String entityType, Long entityId, boolean success, HttpServletRequest request) {
        ActivityLog log = new ActivityLog();
        log.setUserId(user.getId());
        log.setUserEmail(user.getEmail());
        log.setUserName(user.getFullName());
        log.setAction(action);
        log.setDetails(details);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setSuccess(success);
        if (request != null) {
            log.setIpAddress(request.getRemoteAddr());
        }
        repository.save(log);
    }

    @Transactional
    public void logSimple(User user, String action, String details) {
        log(user, action, details, null, null, true, null);
    }

    public List<ActivityLog> getByUser(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<ActivityLog> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public List<ActivityLog> getByDateRange(LocalDateTime start, LocalDateTime end) {
        return repository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
    }
}
