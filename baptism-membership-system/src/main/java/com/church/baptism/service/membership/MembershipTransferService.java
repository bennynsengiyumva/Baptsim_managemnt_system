package com.church.baptism.service.membership;

import com.church.baptism.dto.membership.TransferAnalyticsDTO;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.member.Member;
import com.church.baptism.entity.membership.MembershipTransfer;
import com.church.baptism.entity.notification.Notification.NotificationType;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.member.MemberRepository;
import com.church.baptism.repository.membership.MembershipTransferRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MembershipTransferService {

    private final MembershipTransferRepository transferRepository;
    private final MemberRepository memberRepository;
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public MembershipTransferService(
            MembershipTransferRepository transferRepository,
            MemberRepository memberRepository,
            ChurchRepository churchRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.transferRepository = transferRepository;
        this.memberRepository = memberRepository;
        this.churchRepository = churchRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ================= FLOW 1: MEMBER INITIATES TRANSFER =================
    @Transactional
    public MembershipTransfer requestByMember(Long memberId, Long toChurchId, String reason, User requestedBy) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (member.getStatus() != Member.MemberStatus.ACTIVE) {
            throw new RuntimeException("Only active members can request transfers");
        }

        Church toChurch = churchRepository.findById(toChurchId)
                .orElseThrow(() -> new RuntimeException("Destination church not found"));

        Candidate candidate = member.getCandidate();
        Church fromChurch = candidate.getChurch();
        if (fromChurch == null) {
            throw new RuntimeException("Member has no assigned church");
        }

        if (fromChurch.getId().equals(toChurchId)) {
            throw new RuntimeException("Cannot transfer to the same church");
        }

        validateHierarchy(fromChurch, toChurch);

        MembershipTransfer transfer = new MembershipTransfer();
        transfer.setMember(member);
        transfer.setFromChurch(fromChurch);
        transfer.setToChurch(toChurch);
        transfer.setReason(reason);
        transfer.setRequestedBy(requestedBy);
        transfer.setInitiatorType("MEMBER");
        transfer.setStatus(MembershipTransfer.TransferStatus.PENDING);

        transfer = transferRepository.save(transfer);

        // Notify current church pastor
        notifyChurchPastor(fromChurch,
                "Transfer Request",
                member.getCandidate().getFullName() + " has requested a transfer to " + toChurch.getChurchName());

        return transfer;
    }

    // ================= FLOW 2: CHURCH INITIATES TRANSFER (requests a member from another church) =================
    @Transactional
    public MembershipTransfer requestByChurch(Long memberId, Long targetChurchId, String reason, User requestedBy) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        Church targetChurch = churchRepository.findById(targetChurchId)
                .orElseThrow(() -> new RuntimeException("Target church not found"));

        Candidate candidate = member.getCandidate();
        Church fromChurch = candidate.getChurch();
        if (fromChurch == null) {
            throw new RuntimeException("Member has no assigned church");
        }

        if (fromChurch.getId().equals(targetChurchId)) {
            throw new RuntimeException("Member is already in this church");
        }

        validateHierarchy(fromChurch, targetChurch);

        MembershipTransfer transfer = new MembershipTransfer();
        transfer.setMember(member);
        transfer.setFromChurch(fromChurch);
        transfer.setToChurch(targetChurch);
        transfer.setReason(reason);
        transfer.setRequestedBy(requestedBy);
        transfer.setInitiatorType("CHURCH");
        // Since the new church initiated, they already approve receiving the member
        transfer.setApprovedByToChurch(requestedBy);
        transfer.setStatus(MembershipTransfer.TransferStatus.APPROVED_TO_CHURCH);

        transfer = transferRepository.save(transfer);

        // Notify current church pastor that another church wants their member
        notifyChurchPastor(fromChurch,
                "Member Request from " + targetChurch.getChurchName(),
                targetChurch.getChurchName() + " has requested " + member.getCandidate().getFullName()
                        + " to transfer to their church.");

        return transfer;
    }

    // ================= CURRENT CHURCH PASTOR APPROVES =================
    @Transactional
    public MembershipTransfer approveFromChurch(Long transferId, User pastor) {
        MembershipTransfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Transfer not found"));

        if (transfer.getStatus() == MembershipTransfer.TransferStatus.COMPLETED) {
            throw new RuntimeException("Transfer is already completed");
        }
        if (transfer.getStatus() == MembershipTransfer.TransferStatus.REJECTED) {
            throw new RuntimeException("Transfer has been rejected");
        }
        if (transfer.getApprovedByFromChurch() != null) {
            throw new RuntimeException("Current church already approved this transfer");
        }

        transfer.setApprovedByFromChurch(pastor);

        // If destination already approved (church-initiated flow), complete immediately
        if (transfer.getApprovedByToChurch() != null) {
            return completeTransfer(transfer);
        }

        // Member-initiated: mark as approved by current church, notify member
        transfer.setStatus(MembershipTransfer.TransferStatus.APPROVED_FROM_CHURCH);
        transfer = transferRepository.save(transfer);

        // Notify the member
        notifyMember(transfer.getMember(),
                "Transfer Approved",
                "Your transfer from " + transfer.getFromChurch().getChurchName()
                        + " has been approved. Waiting for destination church approval.");

        // Notify destination church pastor
        notifyChurchPastor(transfer.getToChurch(),
                "Pending Transfer Approval",
                transfer.getMember().getCandidate().getFullName()
                        + " from " + transfer.getFromChurch().getChurchName()
                        + " has a pending transfer request to your church.");

        return transfer;
    }

    // ================= DESTINATION CHURCH PASTOR APPROVES =================
    @Transactional
    public MembershipTransfer approveToChurch(Long transferId, User pastor) {
        MembershipTransfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Transfer not found"));

        if (transfer.getStatus() == MembershipTransfer.TransferStatus.COMPLETED) {
            throw new RuntimeException("Transfer is already completed");
        }
        if (transfer.getStatus() == MembershipTransfer.TransferStatus.REJECTED) {
            throw new RuntimeException("Transfer has been rejected");
        }
        if (transfer.getApprovedByToChurch() != null) {
            throw new RuntimeException("Destination church already approved this transfer");
        }

        transfer.setApprovedByToChurch(pastor);

        // If current church already approved, complete
        if (transfer.getApprovedByFromChurch() != null) {
            return completeTransfer(transfer);
        }

        // Church-initiated: destination approved first, now waiting for current church
        transfer.setStatus(MembershipTransfer.TransferStatus.APPROVED_TO_CHURCH);
        transfer = transferRepository.save(transfer);

        // Notify current church pastor
        notifyChurchPastor(transfer.getFromChurch(),
                "Transfer Approval Needed",
                transfer.getToChurch().getChurchName() + " has approved receiving "
                        + transfer.getMember().getCandidate().getFullName()
                        + ". Please approve the transfer.");

        return transfer;
    }

    // ================= REJECT =================
    @Transactional
    public MembershipTransfer rejectTransfer(Long transferId, User rejectedBy) {
        MembershipTransfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Transfer not found"));

        if (transfer.getStatus() == MembershipTransfer.TransferStatus.COMPLETED) {
            throw new RuntimeException("Cannot reject a completed transfer");
        }

        transfer.setStatus(MembershipTransfer.TransferStatus.REJECTED);
        transfer = transferRepository.save(transfer);

        // Notify the member
        notifyMember(transfer.getMember(),
                "Transfer Rejected",
                "Your transfer request from " + transfer.getFromChurch().getChurchName()
                        + " to " + transfer.getToChurch().getChurchName() + " has been rejected.");

        return transfer;
    }

    // ================= COMPLETE =================
    private MembershipTransfer completeTransfer(MembershipTransfer transfer) {
        Member member = transfer.getMember();
        Candidate candidate = member.getCandidate();

        // Update candidate's church
        candidate.setChurch(transfer.getToChurch());

        // Update member record
        member.setLocalChurch(transfer.getToChurch().getChurchName());
        member.setStatus(Member.MemberStatus.TRANSFERRED);
        member.setTransferHistory(
            member.getTransferHistory() != null
                ? member.getTransferHistory() + "\n"
                    + "Transferred from " + transfer.getFromChurch().getChurchName()
                    + " to " + transfer.getToChurch().getChurchName()
                    + " on " + java.time.LocalDate.now()
                : "Transferred from " + transfer.getFromChurch().getChurchName()
                    + " to " + transfer.getToChurch().getChurchName()
                    + " on " + java.time.LocalDate.now()
        );

        memberRepository.save(member);
        transfer.setStatus(MembershipTransfer.TransferStatus.COMPLETED);
        transfer = transferRepository.save(transfer);

        // Notify member
        notifyMember(member,
                "Transfer Completed",
                "Your transfer to " + transfer.getToChurch().getChurchName() + " has been completed.");

        // Notify both pastors
        notifyChurchPastor(transfer.getFromChurch(),
                "Member Transferred",
                member.getCandidate().getFullName() + " has been transferred to " + transfer.getToChurch().getChurchName());
        notifyChurchPastor(transfer.getToChurch(),
                "New Member Arrived",
                member.getCandidate().getFullName() + " has joined your church.");

        return transfer;
    }

    // ================= NOTIFICATION HELPERS =================
    private void notifyMember(Member member, String title, String message) {
        if (member.getCandidate() != null && member.getCandidate().getEmail() != null) {
            userRepository.findByEmail(member.getCandidate().getEmail())
                    .ifPresent(user ->
                        notificationService.sendToUser(user.getId(), title, message, NotificationType.CHURCH_ANNOUNCEMENT)
                    );
        }
    }

    private void notifyChurchPastor(Church church, String title, String message) {
        if (church.getPastor() != null) {
            notificationService.sendToUser(church.getPastor().getId(), title, message, NotificationType.CHURCH_ANNOUNCEMENT);
        }
    }

    // ================= HIERARCHY VALIDATION =================
    private void validateHierarchy(Church from, Church to) {
        String fromUnion = from.getDistrict() != null && from.getDistrict().getField() != null
                && from.getDistrict().getField().getUnion() != null
                ? from.getDistrict().getField().getUnion().getName() : null;
        String toUnion = to.getDistrict() != null && to.getDistrict().getField() != null
                && to.getDistrict().getField().getUnion() != null
                ? to.getDistrict().getField().getUnion().getName() : null;

        String fromField = from.getDistrict() != null && from.getDistrict().getField() != null
                ? from.getDistrict().getField().getName() : null;
        String toField = to.getDistrict() != null && to.getDistrict().getField() != null
                ? to.getDistrict().getField().getName() : null;

        boolean sameUnion = fromUnion != null && fromUnion.equals(toUnion);
        boolean sameField = fromField != null && fromField.equals(toField);

        if (!sameUnion) {
            throw new RuntimeException(
                "Transfer between different Unions is not allowed. "
                + "From: " + fromUnion + ", To: " + toUnion
            );
        }

        if (!sameField) {
            throw new RuntimeException(
                "Transfer between different Fields requires special approval. "
                + "From: " + fromField + ", To: " + toField
            );
        }
    }

    // ================= QUERIES =================
    public List<MembershipTransfer> getAll() {
        return transferRepository.findAll();
    }

    public List<MembershipTransfer> getByFromChurch(Church church) {
        return transferRepository.findByFromChurch(church);
    }

    public List<MembershipTransfer> getByToChurch(Church church) {
        return transferRepository.findByToChurch(church);
    }

    public List<MembershipTransfer> getByMemberId(Long memberId) {
        return transferRepository.findByMemberId(memberId);
    }

    public TransferAnalyticsDTO getAnalytics() {
        long total = transferRepository.count();
        long pending = transferRepository.findByStatus(MembershipTransfer.TransferStatus.PENDING).size();
        long approved =
            transferRepository.findByStatus(MembershipTransfer.TransferStatus.APPROVED_FROM_CHURCH).size()
            + transferRepository.findByStatus(MembershipTransfer.TransferStatus.APPROVED_TO_CHURCH).size();
        long completed = transferRepository.findByStatus(MembershipTransfer.TransferStatus.COMPLETED).size();
        long rejected = transferRepository.findByStatus(MembershipTransfer.TransferStatus.REJECTED).size();

        return new TransferAnalyticsDTO(total, pending, approved, completed, rejected);
    }
}
