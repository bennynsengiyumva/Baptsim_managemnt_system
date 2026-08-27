package com.church.baptism.repository.audit;

import com.church.baptism.entity.audit.AuthLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuthLogRepository extends JpaRepository<AuthLog, Long> {
    List<AuthLog> findAllByOrderByCreatedAtDesc();
    List<AuthLog> findTop20ByOrderByCreatedAtDesc();
    List<AuthLog> findByUserEmailOrderByCreatedAtDesc(String email);
    long countByAction(String action);
    long countByActionAndSuccess(String action, boolean success);
}
