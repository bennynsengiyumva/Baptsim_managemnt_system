package com.church.baptism.service.audit;

import com.church.baptism.dto.response.LeadershipAuditLogResponse;
import com.church.baptism.entity.audit.LeadershipAuditLog;
import com.church.baptism.repository.audit.LeadershipAuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeadershipAuditLogService {

    private final LeadershipAuditLogRepository auditLogRepository;

    public LeadershipAuditLogService(LeadershipAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<LeadershipAuditLogResponse> getAllLogs() {
        return auditLogRepository.findAllByOrderByEventDateDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LeadershipAuditLogResponse> getLogsByLeader(Long leaderId) {
        return auditLogRepository.findByLeaderIdOrderByEventDateDesc(leaderId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LeadershipAuditLogResponse> getLogsByDistrict(Long districtId) {
        return auditLogRepository.findByDistrictIdOrderByEventDateDesc(districtId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LeadershipAuditLogResponse> getLogsByField(Long fieldId) {
        return auditLogRepository.findByFieldIdOrderByEventDateDesc(fieldId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LeadershipAuditLogResponse> getLogsByEventType(LeadershipAuditLog.EventType eventType) {
        return auditLogRepository.findByEventTypeOrderByEventDateDesc(eventType)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private LeadershipAuditLogResponse mapToResponse(LeadershipAuditLog log) {
        LeadershipAuditLogResponse response = new LeadershipAuditLogResponse();
        response.setId(log.getId());
        response.setEventType(log.getEventType().name());
        response.setLeaderId(log.getLeaderId());
        response.setLeaderName(log.getLeaderName());
        response.setPreviousAssignmentId(log.getPreviousAssignmentId());
        response.setPreviousAssignmentSummary(log.getPreviousAssignmentSummary());
        response.setNewAssignmentId(log.getNewAssignmentId());
        response.setNewAssignmentSummary(log.getNewAssignmentSummary());
        response.setDistrictId(log.getDistrictId());
        response.setDistrictName(log.getDistrictName());
        response.setFieldId(log.getFieldId());
        response.setFieldName(log.getFieldName());
        response.setPerformedBy(log.getPerformedBy());
        response.setReason(log.getReason());
        response.setEventDate(log.getEventDate());
        return response;
    }
}
