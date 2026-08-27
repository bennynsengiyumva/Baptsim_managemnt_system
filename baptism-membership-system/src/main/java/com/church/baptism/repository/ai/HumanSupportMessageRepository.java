package com.church.baptism.repository.ai;

import com.church.baptism.entity.ai.HumanSupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface HumanSupportMessageRepository extends JpaRepository<HumanSupportMessage, Long> {
    List<HumanSupportMessage> findByCandidateIdOrderByCreatedAtDesc(Long candidateId);
    List<HumanSupportMessage> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    List<HumanSupportMessage> findByParentIdOrderByCreatedAtAsc(Long parentId);
    long countByRecipientIdAndStatusNot(Long recipientId, String status);
    long countByCandidateIdAndStatus(Long candidateId, String status);
    long countByRecipientIdAndReadByRecipientFalse(Long recipientId);

    @Query("SELECT h FROM HumanSupportMessage h WHERE h.parent IS NULL AND h.recipient.id = :recipientId ORDER BY h.createdAt DESC")
    List<HumanSupportMessage> findTopLevelByRecipientId(@Param("recipientId") Long recipientId);

    @Query("SELECT h FROM HumanSupportMessage h WHERE h.parent IS NULL AND h.candidate.id = :candidateId ORDER BY h.createdAt DESC")
    List<HumanSupportMessage> findTopLevelByCandidateId(@Param("candidateId") Long candidateId);
}
