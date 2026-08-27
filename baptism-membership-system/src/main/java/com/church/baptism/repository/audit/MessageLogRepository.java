package com.church.baptism.repository.audit;

import com.church.baptism.entity.audit.MessageLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageLogRepository extends JpaRepository<MessageLog, Long> {
    List<MessageLog> findAllByOrderByCreatedAtDesc();
    List<MessageLog> findTop20ByOrderByCreatedAtDesc();
    List<MessageLog> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId);
    long countByAction(String action);
}
