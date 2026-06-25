package com.church.baptism.repository.candidate;

import com.church.baptism.entity.candidate.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    List<Candidate> findByStatus(Candidate.CandidateStatus status);

    List<Candidate> findByChurchId(Long churchId);

    List<Candidate> findByInstructorIsNullAndChurchId(Long churchId);

    List<Candidate> findByInstructorIsNull();

    List<Candidate> findByInstructorId(Long instructorId);

    // ✅ Added — used by CANDIDATE role self-view and role-based filtering in CandidateController
    List<Candidate> findByEmail(String email);

    long countByStatus(Candidate.CandidateStatus status);

    long countByChurchId(Long churchId);

    long countByChurch_ChurchName(String churchName);
}