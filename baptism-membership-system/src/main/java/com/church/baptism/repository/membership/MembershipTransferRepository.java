package com.church.baptism.repository.membership;

import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.membership.MembershipTransfer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MembershipTransferRepository
        extends JpaRepository<MembershipTransfer, Long> {

    List<MembershipTransfer> findByStatus(MembershipTransfer.TransferStatus status);

    List<MembershipTransfer> findByFromChurch(Church church);

    List<MembershipTransfer> findByToChurch(Church church);

    List<MembershipTransfer> findByMemberId(Long memberId);
}
