package com.church.baptism.repository.message;

import com.church.baptism.entity.message.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findBySenderIdOrderByCreatedAtDesc(Long senderId);

    List<Message> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    List<Message> findBySenderIdAndReceiverIdOrderByCreatedAtAsc(Long senderId, Long receiverId);

    @Query("SELECT m FROM Message m WHERE (m.sender.id = :user1 AND m.receiver.id = :user2) OR (m.sender.id = :user2 AND m.receiver.id = :user1) ORDER BY m.createdAt ASC")
    List<Message> findConversationBetween(@Param("user1") Long user1, @Param("user2") Long user2);

    long countByReceiverIdAndReadFalse(Long receiverId);
}
