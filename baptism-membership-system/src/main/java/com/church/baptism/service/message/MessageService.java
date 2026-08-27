package com.church.baptism.service.message;

import com.church.baptism.dto.request.message.MessageRequest;
import com.church.baptism.dto.response.message.MessageResponse;
import com.church.baptism.entity.audit.MessageLog;
import com.church.baptism.entity.message.Message;
import com.church.baptism.entity.notification.Notification;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.audit.MessageLogRepository;
import com.church.baptism.repository.message.MessageRepository;
import com.church.baptism.repository.notification.NotificationRepository;
import com.church.baptism.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final MessageLogRepository messageLogRepository;

    @Transactional
    public MessageResponse sendMessage(Long senderId, MessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setSubject(request.getSubject());
        message.setContent(request.getContent());
        message.setRead(false);
        messageRepository.save(message);

        // Send notification to receiver
        Notification notification = new Notification();
        notification.setUser(receiver);
        notification.setType(Notification.NotificationType.SYSTEM);
        notification.setTitle("New message from " + sender.getFullName());
        notification.setMessage(request.getSubject() != null ? request.getSubject() : "You have a new message");
        notification.setRead(false);
        notificationRepository.save(notification);

        // Log message
        try {
            MessageLog msgLog = new MessageLog();
            msgLog.setSenderId(sender.getId());
            msgLog.setSenderName(sender.getFullName());
            msgLog.setReceiverId(receiver.getId());
            msgLog.setReceiverName(receiver.getFullName());
            msgLog.setAction("MESSAGE_SENT");
            msgLog.setSubject(request.getSubject());
            msgLog.setMessagePreview(request.getContent() != null && request.getContent().length() > 100
                    ? request.getContent().substring(0, 100) + "..." : request.getContent());
            msgLog.setConversationId(Math.min(sender.getId(), receiver.getId()) + "-" + Math.max(sender.getId(), receiver.getId()));
            messageLogRepository.save(msgLog);
        } catch (Exception ignored) {
        }

        return toResponse(message);
    }

    public List<MessageResponse> getInbox(Long userId) {
        return messageRepository.findByReceiverIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MessageResponse> getSentMessages(Long userId) {
        return messageRepository.findBySenderIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MessageResponse> getConversation(Long userId1, Long userId2) {
        return messageRepository.findConversationBetween(userId1, userId2)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void markAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setRead(true);
        messageRepository.save(message);

        try {
            MessageLog msgLog = new MessageLog();
            msgLog.setSenderId(message.getSender().getId());
            msgLog.setSenderName(message.getSender().getFullName());
            msgLog.setReceiverId(message.getReceiver().getId());
            msgLog.setReceiverName(message.getReceiver().getFullName());
            msgLog.setAction("MESSAGE_READ");
            msgLog.setSubject(message.getSubject());
            msgLog.setConversationId(Math.min(message.getSender().getId(), message.getReceiver().getId()) + "-" + Math.max(message.getSender().getId(), message.getReceiver().getId()));
            messageLogRepository.save(msgLog);
        } catch (Exception ignored) {
        }
    }

    public long getUnreadCount(Long userId) {
        return messageRepository.countByReceiverIdAndReadFalse(userId);
    }

    private MessageResponse toResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .senderEmail(message.getSender().getEmail())
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getFullName())
                .receiverEmail(message.getReceiver().getEmail())
                .subject(message.getSubject())
                .content(message.getContent())
                .read(message.isRead())
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt().toString() : null)
                .build();
    }
}
