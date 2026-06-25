package com.church.baptism.service.message;

import com.church.baptism.dto.request.message.MessageRequest;
import com.church.baptism.dto.response.message.MessageResponse;
import com.church.baptism.entity.message.Message;
import com.church.baptism.entity.notification.Notification;
import com.church.baptism.entity.user.User;
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
        return messageRepository.findBySenderIdAndReceiverIdOrderByCreatedAtAsc(userId1, userId2)
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
