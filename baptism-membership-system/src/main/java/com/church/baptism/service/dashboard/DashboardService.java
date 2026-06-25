package com.church.baptism.service.dashboard;

import com.church.baptism.dto.dashboard.DashboardStatsDTO;
import com.church.baptism.entity.membership.MembershipTransfer;
import com.church.baptism.entity.user.Role;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.membership.MembershipTransferRepository;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final CandidateRepository candidateRepository;
    private final MembershipTransferRepository transferRepository;
    private final BaptismRepository baptismRepository;
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;

    public DashboardService(
            CandidateRepository candidateRepository,
            MembershipTransferRepository transferRepository,
            BaptismRepository baptismRepository,
            ChurchRepository churchRepository,
            UserRepository userRepository
    ) {
        this.candidateRepository = candidateRepository;
        this.transferRepository = transferRepository;
        this.baptismRepository = baptismRepository;
        this.churchRepository = churchRepository;
        this.userRepository = userRepository;
    }

    public DashboardStatsDTO getStats() {

        long totalCandidates = candidateRepository.count();

        long activeCandidates = totalCandidates;

        long baptizedCandidates = baptismRepository.count();

        long pendingTransfers = transferRepository
                .findByStatus(MembershipTransfer.TransferStatus.PENDING)
                .size();

        long totalChurches = churchRepository.count();

        long totalInstructors = getInstructorCount();

        long totalMembers = userRepository.count();

        double completionRate = calculateCompletionRate();

        return new DashboardStatsDTO(
                totalCandidates,
                activeCandidates,
                baptizedCandidates,
                pendingTransfers,
                totalChurches,
                totalInstructors,
                totalMembers,
                completionRate
        );
    }

    private long getInstructorCount() {
        try {
            return userRepository.countByRole(Role.INSTRUCTOR);
        } catch (Exception ex) {
            return 0;
        }
    }

    private double calculateCompletionRate() {
        return 75.0;
    }
}