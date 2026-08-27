package com.church.baptism.repository.ai;

import com.church.baptism.entity.ai.AiChat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiChatRepository extends JpaRepository<AiChat, Long> {
    List<AiChat> findByCandidateIdOrderByCreatedAtDesc(Long candidateId);
}
