package com.church.baptism.repository.cohort;

import com.church.baptism.entity.cohort.CohortMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CohortMemberRepository extends JpaRepository<CohortMember, Long> {
    List<CohortMember> findByCohortId(Long cohortId);
    List<CohortMember> findByCandidateId(Long candidateId);
    Optional<CohortMember> findByCohortIdAndCandidateId(Long cohortId, Long candidateId);
    boolean existsByCohortIdAndCandidateId(Long cohortId, Long candidateId);
    long countByCohortIdAndStatus(Long cohortId, CohortMember.EnrollmentStatus status);
    List<CohortMember> findByCohortIdAndStatus(Long cohortId, CohortMember.EnrollmentStatus status);
}
