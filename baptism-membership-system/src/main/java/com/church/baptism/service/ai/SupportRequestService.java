package com.church.baptism.service.ai;

import com.church.baptism.dto.request.ai.ReplyRequest;
import com.church.baptism.dto.response.ai.HumanSupportMessageResponse;
import com.church.baptism.entity.ai.HumanSupportMessage;
import com.church.baptism.entity.notification.Notification;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.ai.HumanSupportMessageRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportRequestService {

    private final HumanSupportMessageRepository supportRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public HumanSupportMessageResponse replyToRequest(Long userId, ReplyRequest request) {
        log.info("SUPPORT_REQUEST_REPLY: userId={}, supportRequestId={}", userId, request.getSupportRequestId());

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        HumanSupportMessage parent = supportRepository.findById(request.getSupportRequestId())
                .orElseThrow(() -> new RuntimeException("Support request not found"));

        HumanSupportMessage reply = new HumanSupportMessage();
        reply.setCandidate(parent.getCandidate());
        reply.setRecipient(parent.getRecipient());
        reply.setRecipientRole(parent.getRecipientRole());
        reply.setSubject(parent.getSubject());
        reply.setMessage(request.getMessage());
        reply.setParent(parent);
        reply.setReply(true);
        reply.setSender(sender);
        reply.setStatus("RESPONDED");
        reply = supportRepository.save(reply);

        parent.setStatus("RESPONDED");
        supportRepository.save(parent);

        Long notifyUserId = sender.getId().equals(parent.getCandidate().getId())
                ? parent.getRecipient().getId()
                : parent.getCandidate().getId();
        String senderName = sender.getFullName();

        try {
            notificationService.sendToUser(
                notifyUserId,
                "New reply from " + senderName,
                "Re: " + parent.getSubject(),
                Notification.NotificationType.SYSTEM
            );
        } catch (Exception e) {
            log.error("NOTIFICATION_FAILED: userId={}, error={}", notifyUserId, e.getMessage());
        }

        return toResponse(reply);
    }

    @Transactional
    public void markAsRead(Long userId, Long supportRequestId) {
        HumanSupportMessage msg = supportRepository.findById(supportRequestId)
                .orElseThrow(() -> new RuntimeException("Support request not found"));

        if (msg.getCandidate().getId().equals(userId)) {
            msg.setReadByCandidate(true);
        } else if (msg.getRecipient().getId().equals(userId)) {
            msg.setReadByRecipient(true);
        }
        supportRepository.save(msg);
    }

    @Transactional
    public void closeRequest(Long userId, Long supportRequestId) {
        HumanSupportMessage msg = supportRepository.findById(supportRequestId)
                .orElseThrow(() -> new RuntimeException("Support request not found"));

        if (!msg.getCandidate().getId().equals(userId) && !msg.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        msg.setStatus("CLOSED");
        supportRepository.save(msg);
    }

    public List<HumanSupportMessageResponse> getRecipientRequests(Long recipientId) {
        List<HumanSupportMessage> topLevel = supportRepository.findTopLevelByRecipientId(recipientId);
        return topLevel.stream().map(this::toResponseWithReplies).collect(Collectors.toList());
    }

    public List<HumanSupportMessageResponse> getCandidateRequests(Long candidateId) {
        List<HumanSupportMessage> topLevel = supportRepository.findTopLevelByCandidateId(candidateId);
        return topLevel.stream().map(this::toResponseWithReplies).collect(Collectors.toList());
    }

    public long getUnreadCountForRecipient(Long recipientId) {
        return supportRepository.countByRecipientIdAndReadByRecipientFalse(recipientId);
    }

    public long getPendingCountForCandidate(Long candidateId) {
        return supportRepository.countByCandidateIdAndStatus(candidateId, "WAITING_FOR_RESPONSE");
    }

    private HumanSupportMessageResponse toResponseWithReplies(HumanSupportMessage msg) {
        List<HumanSupportMessage> replies = supportRepository.findByParentIdOrderByCreatedAtAsc(msg.getId());
        return HumanSupportMessageResponse.builder()
                .id(msg.getId())
                .candidateId(msg.getCandidate().getId())
                .candidateName(msg.getCandidate().getFullName())
                .recipientName(msg.getRecipient() != null ? msg.getRecipient().getFullName() : "Unknown")
                .recipientRole(msg.getRecipientRole())
                .subject(msg.getSubject())
                .message(msg.getMessage())
                .status(msg.getStatus())
                .createdAt(msg.getCreatedAt())
                .readByRecipient(msg.isReadByRecipient())
                .readByCandidate(msg.isReadByCandidate())
                .isReply(false)
                .parentId(null)
                .replies(replies.stream().map(this::toResponse).collect(Collectors.toList()))
                .build();
    }

    private HumanSupportMessageResponse toResponse(HumanSupportMessage msg) {
        return HumanSupportMessageResponse.builder()
                .id(msg.getId())
                .candidateId(msg.getCandidate().getId())
                .candidateName(msg.getCandidate().getFullName())
                .recipientName(msg.getRecipient() != null ? msg.getRecipient().getFullName() : "Unknown")
                .recipientRole(msg.getRecipientRole())
                .subject(msg.getSubject())
                .message(msg.getMessage())
                .status(msg.getStatus())
                .createdAt(msg.getCreatedAt())
                .readByRecipient(msg.isReadByRecipient())
                .readByCandidate(msg.isReadByCandidate())
                .isReply(msg.isReply())
                .parentId(msg.getParent() != null ? msg.getParent().getId() : null)
                .senderName(msg.getSender() != null ? msg.getSender().getFullName() : null)
                .replies(null)
                .build();
    }
}
