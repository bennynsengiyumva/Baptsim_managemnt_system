package com.church.baptism.entity.membership;

import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.member.Member;
import com.church.baptism.entity.user.User;
import jakarta.persistence.*;

@Entity
public class MembershipTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Member member;

    @ManyToOne
    private Church fromChurch;

    @ManyToOne
    private Church toChurch;

    private String reason;

    @ManyToOne
    private User requestedBy;

    private String initiatorType; // "MEMBER" or "CHURCH"

    @ManyToOne
    private User approvedByFromChurch;

    @ManyToOne
    private User approvedByToChurch;

    @Enumerated(EnumType.STRING)
    private TransferStatus status;

    public enum TransferStatus {
        PENDING,
        APPROVED_FROM_CHURCH,
        APPROVED_TO_CHURCH,
        COMPLETED,
        REJECTED
    }

    public Long getId() { return id; }

    public Member getMember() { return member; }
    public void setMember(Member member) { this.member = member; }

    public Church getFromChurch() { return fromChurch; }
    public void setFromChurch(Church fromChurch) { this.fromChurch = fromChurch; }

    public Church getToChurch() { return toChurch; }
    public void setToChurch(Church toChurch) { this.toChurch = toChurch; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public User getRequestedBy() { return requestedBy; }
    public void setRequestedBy(User requestedBy) { this.requestedBy = requestedBy; }

    public String getInitiatorType() { return initiatorType; }
    public void setInitiatorType(String initiatorType) { this.initiatorType = initiatorType; }

    public User getApprovedByFromChurch() { return approvedByFromChurch; }
    public void setApprovedByFromChurch(User approvedByFromChurch) {
        this.approvedByFromChurch = approvedByFromChurch;
    }

    public User getApprovedByToChurch() { return approvedByToChurch; }
    public void setApprovedByToChurch(User approvedByToChurch) {
        this.approvedByToChurch = approvedByToChurch;
    }

    public TransferStatus getStatus() { return status; }
    public void setStatus(TransferStatus status) { this.status = status; }
}
