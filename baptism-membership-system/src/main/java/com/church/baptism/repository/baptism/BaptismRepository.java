package com.church.baptism.repository.baptism;

import com.church.baptism.entity.baptism.Baptism;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BaptismRepository extends JpaRepository<Baptism, Long> {
    long countByCandidate_Church_ChurchName(String churchName);
    List<Baptism> findByEventIdOrderByBaptismOrderAsc(Long eventId);
    List<Baptism> findByCandidateId(Long candidateId);
    boolean existsByCandidateIdAndBaptizedTrue(Long candidateId);
    List<Baptism> findByBaptizedTrueAndCertificateSignedFalse();
    List<Baptism> findByBaptizedTrueOrderByConfirmedAtDesc();
    Optional<Baptism> findByCertificateNumber(String certificateNumber);
}
