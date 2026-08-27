package com.church.baptism.service.church;

import com.church.baptism.dto.request.FieldTransferRequest;
import com.church.baptism.dto.response.FieldAssignmentResponse;
import com.church.baptism.entity.audit.LeadershipAuditLog;
import com.church.baptism.entity.church.ChurchField;
import com.church.baptism.entity.church.FieldAssignment;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.audit.LeadershipAuditLogRepository;
import com.church.baptism.repository.church.ChurchFieldRepository;
import com.church.baptism.repository.church.FieldAssignmentRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.notification.NotificationService;
import com.church.baptism.entity.notification.Notification.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FieldAssignmentService {

    private final FieldAssignmentRepository assignmentRepository;
    private final ChurchFieldRepository fieldRepository;
    private final UserRepository userRepository;
    private final LeadershipAuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    public FieldAssignmentService(FieldAssignmentRepository assignmentRepository,
                                  ChurchFieldRepository fieldRepository,
                                  UserRepository userRepository,
                                  LeadershipAuditLogRepository auditLogRepository,
                                  NotificationService notificationService) {
        this.assignmentRepository = assignmentRepository;
        this.fieldRepository = fieldRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public FieldAssignmentResponse changeHeadOfField(FieldTransferRequest request, String adminEmail) {
        ChurchField field = fieldRepository.findById(request.fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        FieldAssignment previousAssignment = null;

        // End current active assignment
        List<FieldAssignment> currentAssignments = assignmentRepository.findByFieldIdAndStatus(
                field.getId(), FieldAssignment.AssignmentStatus.ACTIVE);
        if (!currentAssignments.isEmpty()) {
            previousAssignment = currentAssignments.get(0);
            previousAssignment.setStatus(FieldAssignment.AssignmentStatus.ENDED);
            previousAssignment.setEndDate(request.effectiveDate);
            assignmentRepository.save(previousAssignment);

            // Clear the old head's field FK and downgrade role
            User oldHead = previousAssignment.getHead();
            if (oldHead.getField() != null && oldHead.getField().getId().equals(field.getId())) {
                oldHead.setField(null);
            }
            // Downgrade role from HEAD_OF_FIELD to PASTOR (no longer a field leader)
            if (oldHead.getRole() == Role.HEAD_OF_FIELD) {
                oldHead.setRole(Role.PASTOR);
            }
            // Set role change message for login notification
            oldHead.setRoleChangeMessage("Your role has been changed from HEAD_OF_FIELD to PASTOR. Field \"" + field.getName() + "\" now has a new leader.");
            userRepository.save(oldHead);

            notificationService.sendToUser(
                    oldHead.getId(),
                    "Field Leadership Ended",
                    "Your assignment as head of field: " + field.getName() + " has ended",
                    NotificationType.SYSTEM
            );
        }

        // Find and verify new head
        User newHead = userRepository.findById(request.newHeadId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        newHead.setRole(Role.HEAD_OF_FIELD);

        // End any existing active assignment for this new head (from another field)
        assignmentRepository.findByHeadIdAndStatus(
                newHead.getId(), FieldAssignment.AssignmentStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(FieldAssignment.AssignmentStatus.ENDED);
                    existing.setEndDate(request.effectiveDate);
                    assignmentRepository.save(existing);
                });

        // Create new assignment
        FieldAssignment assignment = new FieldAssignment();
        assignment.setField(field);
        assignment.setHead(newHead);
        assignment.setStartDate(request.effectiveDate);
        assignment.setStatus(FieldAssignment.AssignmentStatus.ACTIVE);
        assignment.setReason(request.reason);
        assignment.setPerformedBy(adminEmail);
        assignment = assignmentRepository.save(assignment);

        // Update the new head's field FK
        newHead.setField(field);
        userRepository.save(newHead);

        notificationService.sendToUser(
                newHead.getId(),
                "New Field Assignment",
                "You have been assigned as head of field: " + field.getName(),
                NotificationType.SYSTEM
        );

        // Create audit log
        LeadershipAuditLog auditLog = new LeadershipAuditLog();
        auditLog.setEventType(LeadershipAuditLog.EventType.HEAD_OF_FIELD_REPLACED);
        auditLog.setLeaderId(newHead.getId());
        auditLog.setLeaderName(newHead.getFullName());
        auditLog.setFieldId(field.getId());
        auditLog.setFieldName(field.getName());
        if (field.getUnion() != null) {
            auditLog.setDistrictId(null);
        }
        auditLog.setPerformedBy(adminEmail);
        auditLog.setReason(request.reason);
        auditLog.setEventDate(LocalDateTime.now());
        if (previousAssignment != null) {
            auditLog.setPreviousAssignmentId(previousAssignment.getId());
            auditLog.setPreviousAssignmentSummary(previousAssignment.getHead().getFullName() +
                    " - " + field.getName() + " (" + previousAssignment.getStartDate() + " to " + previousAssignment.getEndDate() + ")");
        }
        auditLog.setNewAssignmentId(assignment.getId());
        auditLog.setNewAssignmentSummary(newHead.getFullName() +
                " - " + field.getName() + " (from " + request.effectiveDate + ")");
        auditLogRepository.save(auditLog);

        return mapToResponse(assignment);
    }

    @Transactional
    public FieldAssignmentResponse appointHeadOfField(FieldTransferRequest request, String adminEmail) {
        ChurchField field = fieldRepository.findById(request.fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        // Check if field already has an active head
        List<FieldAssignment> currentAssignments = assignmentRepository.findByFieldIdAndStatus(
                field.getId(), FieldAssignment.AssignmentStatus.ACTIVE);
        if (!currentAssignments.isEmpty()) {
            throw new RuntimeException("Field already has an active head. Use change-head to replace.");
        }

        // Find and verify new head
        User newHead = userRepository.findById(request.newHeadId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        newHead.setRole(Role.HEAD_OF_FIELD);

        // Create new assignment
        FieldAssignment assignment = new FieldAssignment();
        assignment.setField(field);
        assignment.setHead(newHead);
        assignment.setStartDate(request.effectiveDate);
        assignment.setStatus(FieldAssignment.AssignmentStatus.ACTIVE);
        assignment.setReason(request.reason);
        assignment.setPerformedBy(adminEmail);
        assignment = assignmentRepository.save(assignment);

        // Update the new head's field FK
        newHead.setField(field);
        userRepository.save(newHead);

        notificationService.sendToUser(
                newHead.getId(),
                "New Field Appointment",
                "You have been appointed as head of field: " + field.getName(),
                NotificationType.SYSTEM
        );

        // Create audit log
        LeadershipAuditLog auditLog = new LeadershipAuditLog();
        auditLog.setEventType(LeadershipAuditLog.EventType.HEAD_OF_FIELD_APPOINTED);
        auditLog.setLeaderId(newHead.getId());
        auditLog.setLeaderName(newHead.getFullName());
        auditLog.setFieldId(field.getId());
        auditLog.setFieldName(field.getName());
        auditLog.setPerformedBy(adminEmail);
        auditLog.setReason(request.reason);
        auditLog.setEventDate(LocalDateTime.now());
        auditLog.setNewAssignmentId(assignment.getId());
        auditLog.setNewAssignmentSummary(newHead.getFullName() +
                " - " + field.getName() + " (from " + request.effectiveDate + ")");
        auditLogRepository.save(auditLog);

        return mapToResponse(assignment);
    }

    public FieldAssignmentResponse getActiveAssignmentForField(Long fieldId) {
        return assignmentRepository.findByFieldIdAndStatus(fieldId, FieldAssignment.AssignmentStatus.ACTIVE)
                .stream().findFirst()
                .map(this::mapToResponse)
                .orElse(null);
    }

    public FieldAssignmentResponse getActiveAssignmentForHead(Long headId) {
        return assignmentRepository.findByHeadIdAndStatus(headId, FieldAssignment.AssignmentStatus.ACTIVE)
                .map(this::mapToResponse)
                .orElse(null);
    }

    public List<FieldAssignmentResponse> getAssignmentHistory(Long fieldId) {
        return assignmentRepository.findByFieldIdOrderByStartDateDesc(fieldId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FieldAssignmentResponse> getAssignmentHistoryForHead(Long headId) {
        return assignmentRepository.findByHeadIdOrderByStartDateDesc(headId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FieldAssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FieldAssignmentResponse> getActiveAssignmentsByUnion(Long unionId) {
        return assignmentRepository.findActiveByUnionId(unionId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FieldAssignmentResponse mapToResponse(FieldAssignment assignment) {
        FieldAssignmentResponse response = new FieldAssignmentResponse();
        response.setId(assignment.getId());
        response.setFieldId(assignment.getField().getId());
        response.setFieldName(assignment.getField().getName());
        response.setHeadId(assignment.getHead().getId());
        response.setHeadName(assignment.getHead().getFullName());
        response.setHeadEmail(assignment.getHead().getEmail());
        response.setStartDate(assignment.getStartDate());
        response.setEndDate(assignment.getEndDate());
        response.setStatus(assignment.getStatus().name());
        response.setReason(assignment.getReason());
        response.setPerformedBy(assignment.getPerformedBy());
        return response;
    }
}
