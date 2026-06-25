package com.church.baptism.repository.message;

import com.church.baptism.entity.message.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findBySenderIdOrderByCreatedAtDesc(Long senderId);

    List<Message> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    List<Message> findBySenderIdAndReceiverIdOrderByCreatedAtAsc(Long senderId, Long receiverId);

    long countByReceiverIdAndReadFalse(Long receiverId);
}
