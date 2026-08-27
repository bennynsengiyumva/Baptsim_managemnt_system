package com.church.baptism.service.church;

import com.church.baptism.dto.request.DistrictTransferRequest;
import com.church.baptism.dto.response.DistrictAssignmentResponse;
import com.church.baptism.entity.audit.LeadershipAuditLog;
import com.church.baptism.entity.church.District;
import com.church.baptism.entity.church.DistrictAssignment;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.audit.LeadershipAuditLogRepository;
import com.church.baptism.repository.church.DistrictAssignmentRepository;
import com.church.baptism.repository.church.DistrictRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.notification.NotificationService;
import com.church.baptism.entity.notification.Notification.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DistrictAssignmentService {

    private final DistrictAssignmentRepository assignmentRepository;
    private final DistrictRepository districtRepository;
    private final UserRepository userRepository;
    private final LeadershipAuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    public DistrictAssignmentService(DistrictAssignmentRepository assignmentRepository,
                                     DistrictRepository districtRepository,
                                     UserRepository userRepository,
                                     LeadershipAuditLogRepository auditLogRepository,
                                     NotificationService notificationService) {
        this.assignmentRepository = assignmentRepository;
        this.districtRepository = districtRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public DistrictAssignmentResponse transferHeadOfDistrict(DistrictTransferRequest request, String adminEmail) {
        District district = districtRepository.findById(request.districtId)
                .orElseThrow(() -> new RuntimeException("District not found"));

        DistrictAssignment previousAssignment = null;

        // Close current active assignment if any
        List<DistrictAssignment> currentAssignments = assignmentRepository.findByDistrictIdAndStatus(
                district.getId(), DistrictAssignment.AssignmentStatus.ACTIVE);
        if (!currentAssignments.isEmpty()) {
            previousAssignment = currentAssignments.get(0);
            previousAssignment.setStatus(DistrictAssignment.AssignmentStatus.TRANSFERRED);
            previousAssignment.setEndDate(request.effectiveDate);
            assignmentRepository.save(previousAssignment);

            // Clear the old pastor's district FK and downgrade role
            User oldPastor = previousAssignment.getPastor();
            if (oldPastor.getDistrict() != null && oldPastor.getDistrict().getId().equals(district.getId())) {
                oldPastor.setDistrict(null);
            }
            // Downgrade role from HEAD_OF_DISTRICT to PASTOR (no longer a district leader)
            if (oldPastor.getRole() == Role.HEAD_OF_DISTRICT) {
                oldPastor.setRole(Role.PASTOR);
            }
            // Set role change message for login notification
            oldPastor.setRoleChangeMessage("Your role has been changed from HEAD_OF_DISTRICT to PASTOR. District \"" + district.getName() + "\" now has a new leader.");
            userRepository.save(oldPastor);

            // Notify outgoing pastor
            notificationService.sendToUser(
                    oldPastor.getId(),
                    "District Assignment Ended",
                    "You have been transferred out of district: " + district.getName(),
                    NotificationType.SYSTEM
            );
        }

        // Find and verify new pastor
        User newPastor = userRepository.findById(request.newHeadPastorId)
                .orElseThrow(() -> new RuntimeException("Pastor not found"));
        newPastor.setRole(Role.HEAD_OF_DISTRICT);

        // Create new assignment
        DistrictAssignment assignment = new DistrictAssignment();
        assignment.setDistrict(district);
        assignment.setPastor(newPastor);
        assignment.setStartDate(request.effectiveDate);
        assignment.setStatus(DistrictAssignment.AssignmentStatus.ACTIVE);
        assignment.setReason(request.reason);
        assignment.setPerformedBy(adminEmail);
        assignment = assignmentRepository.save(assignment);

        // Update the new pastor's district FK
        newPastor.setDistrict(district);
        userRepository.save(newPastor);

        // Notify incoming pastor
        notificationService.sendToUser(
                newPastor.getId(),
                "New District Assignment",
                "You have been assigned as head of district: " + district.getName(),
                NotificationType.SYSTEM
        );

        // Create audit log
        LeadershipAuditLog auditLog = new LeadershipAuditLog();
        auditLog.setEventType(LeadershipAuditLog.EventType.HEAD_OF_DISTRICT_TRANSFERRED);
        auditLog.setLeaderId(newPastor.getId());
        auditLog.setLeaderName(newPastor.getFullName());
        auditLog.setDistrictId(district.getId());
        auditLog.setDistrictName(district.getName());
        if (district.getField() != null) {
            auditLog.setFieldId(district.getField().getId());
            auditLog.setFieldName(district.getField().getName());
        }
        auditLog.setPerformedBy(adminEmail);
        auditLog.setReason(request.reason);
        auditLog.setEventDate(LocalDateTime.now());
        if (previousAssignment != null) {
            auditLog.setPreviousAssignmentId(previousAssignment.getId());
            auditLog.setPreviousAssignmentSummary(previousAssignment.getPastor().getFullName() +
                    " - " + district.getName() + " (" + previousAssignment.getStartDate() + " to " + previousAssignment.getEndDate() + ")");
        }
        auditLog.setNewAssignmentId(assignment.getId());
        auditLog.setNewAssignmentSummary(newPastor.getFullName() +
                " - " + district.getName() + " (from " + request.effectiveDate + ")");
        auditLogRepository.save(auditLog);

        return mapToResponse(assignment);
    }

    @Transactional
    public DistrictAssignmentResponse reassignHeadOfDistrict(DistrictTransferRequest request, String adminEmail) {
        District district = districtRepository.findById(request.districtId)
                .orElseThrow(() -> new RuntimeException("District not found"));

        DistrictAssignment previousAssignment = null;

        // Close current active assignment
        List<DistrictAssignment> currentAssignments = assignmentRepository.findByDistrictIdAndStatus(
                district.getId(), DistrictAssignment.AssignmentStatus.ACTIVE);
        if (!currentAssignments.isEmpty()) {
            previousAssignment = currentAssignments.get(0);
            previousAssignment.setStatus(DistrictAssignment.AssignmentStatus.ENDED);
            previousAssignment.setEndDate(request.effectiveDate);
            assignmentRepository.save(previousAssignment);

            // Clear the old pastor's district FK and downgrade role
            User oldPastor = previousAssignment.getPastor();
            if (oldPastor.getDistrict() != null && oldPastor.getDistrict().getId().equals(district.getId())) {
                oldPastor.setDistrict(null);
            }
            // Downgrade role from HEAD_OF_DISTRICT to PASTOR (no longer a district leader)
            if (oldPastor.getRole() == Role.HEAD_OF_DISTRICT) {
                oldPastor.setRole(Role.PASTOR);
            }
            // Set role change message for login notification
            oldPastor.setRoleChangeMessage("Your role has been changed from HEAD_OF_DISTRICT to PASTOR. District \"" + district.getName() + "\" now has a new leader.");
            userRepository.save(oldPastor);

            notificationService.sendToUser(
                    oldPastor.getId(),
                    "District Assignment Ended",
                    "Your assignment as head of district: " + district.getName() + " has ended",
                    NotificationType.SYSTEM
            );
        }

        // Find and verify new pastor
        User newPastor = userRepository.findById(request.newHeadPastorId)
                .orElseThrow(() -> new RuntimeException("Pastor not found"));
        newPastor.setRole(Role.HEAD_OF_DISTRICT);

        // Create new assignment
        DistrictAssignment assignment = new DistrictAssignment();
        assignment.setDistrict(district);
        assignment.setPastor(newPastor);
        assignment.setStartDate(request.effectiveDate);
        assignment.setStatus(DistrictAssignment.AssignmentStatus.ACTIVE);
        assignment.setReason(request.reason);
        assignment.setPerformedBy(adminEmail);
        assignment = assignmentRepository.save(assignment);

        // Update the new pastor's district FK
        newPastor.setDistrict(district);
        userRepository.save(newPastor);

        notificationService.sendToUser(
                newPastor.getId(),
                "New District Assignment",
                "You have been assigned as head of district: " + district.getName(),
                NotificationType.SYSTEM
        );

        // Create audit log
        LeadershipAuditLog auditLog = new LeadershipAuditLog();
        auditLog.setEventType(LeadershipAuditLog.EventType.HEAD_OF_DISTRICT_REASSIGNED);
        auditLog.setLeaderId(newPastor.getId());
        auditLog.setLeaderName(newPastor.getFullName());
        auditLog.setDistrictId(district.getId());
        auditLog.setDistrictName(district.getName());
        if (district.getField() != null) {
            auditLog.setFieldId(district.getField().getId());
            auditLog.setFieldName(district.getField().getName());
        }
        auditLog.setPerformedBy(adminEmail);
        auditLog.setReason(request.reason);
        auditLog.setEventDate(LocalDateTime.now());
        if (previousAssignment != null) {
            auditLog.setPreviousAssignmentId(previousAssignment.getId());
            auditLog.setPreviousAssignmentSummary(previousAssignment.getPastor().getFullName() +
                    " - " + district.getName() + " (" + previousAssignment.getStartDate() + " to " + previousAssignment.getEndDate() + ")");
        }
        auditLog.setNewAssignmentId(assignment.getId());
        auditLog.setNewAssignmentSummary(newPastor.getFullName() +
                " - " + district.getName() + " (from " + request.effectiveDate + ")");
        auditLogRepository.save(auditLog);

        return mapToResponse(assignment);
    }

    public DistrictAssignmentResponse getActiveAssignmentForDistrict(Long districtId) {
        return assignmentRepository.findByDistrictIdAndStatus(districtId, DistrictAssignment.AssignmentStatus.ACTIVE)
                .stream().findFirst()
                .map(this::mapToResponse)
                .orElse(null);
    }

    public DistrictAssignmentResponse getActiveAssignmentForPastor(Long pastorId) {
        return assignmentRepository.findByPastorIdAndStatus(pastorId, DistrictAssignment.AssignmentStatus.ACTIVE)
                .map(this::mapToResponse)
                .orElse(null);
    }

    public List<DistrictAssignmentResponse> getAssignmentHistory(Long districtId) {
        return assignmentRepository.findByDistrictIdOrderByStartDateDesc(districtId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DistrictAssignmentResponse> getAssignmentHistoryForPastor(Long pastorId) {
        return assignmentRepository.findByPastorIdOrderByStartDateDesc(pastorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DistrictAssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DistrictAssignmentResponse> getActiveAssignmentsByField(Long fieldId) {
        return assignmentRepository.findActiveByFieldId(fieldId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DistrictAssignmentResponse> getActiveAssignmentsByUnion(Long unionId) {
        return assignmentRepository.findActiveByUnionId(unionId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private DistrictAssignmentResponse mapToResponse(DistrictAssignment assignment) {
        DistrictAssignmentResponse response = new DistrictAssignmentResponse();
        response.setId(assignment.getId());
        response.setDistrictId(assignment.getDistrict().getId());
        response.setDistrictName(assignment.getDistrict().getName());
        response.setPastorId(assignment.getPastor().getId());
        response.setPastorName(assignment.getPastor().getFullName());
        response.setPastorEmail(assignment.getPastor().getEmail());
        response.setStartDate(assignment.getStartDate());
        response.setEndDate(assignment.getEndDate());
        response.setStatus(assignment.getStatus().name());
        response.setReason(assignment.getReason());
        response.setPerformedBy(assignment.getPerformedBy());
        return response;
    }
}
