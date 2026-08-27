package com.church.baptism.repository.audit;

import com.church.baptism.entity.audit.LeadershipAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeadershipAuditLogRepository extends JpaRepository<LeadershipAuditLog, Long> {
    List<LeadershipAuditLog> findByLeaderIdOrderByEventDateDesc(Long leaderId);
    List<LeadershipAuditLog> findByDistrictIdOrderByEventDateDesc(Long districtId);
    List<LeadershipAuditLog> findByFieldIdOrderByEventDateDesc(Long fieldId);
    List<LeadershipAuditLog> findByEventTypeOrderByEventDateDesc(LeadershipAuditLog.EventType eventType);
    List<LeadershipAuditLog> findAllByOrderByEventDateDesc();
}
