package com.church.baptism.repository.ai;

import com.church.baptism.entity.ai.AiChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {
    List<AiChatMessage> findByChatIdOrderByCreatedAtAsc(Long chatId);
}
