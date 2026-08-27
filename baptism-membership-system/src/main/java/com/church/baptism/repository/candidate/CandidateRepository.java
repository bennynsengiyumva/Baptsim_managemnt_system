package com.church.baptism.repository.candidate;

import com.church.baptism.entity.candidate.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    List<Candidate> findByStatus(Candidate.CandidateStatus status);

    List<Candidate> findByChurchId(Long churchId);

    List<Candidate> findByInstructorIsNullAndChurchId(Long churchId);

    List<Candidate> findByInstructorIsNull();

    List<Candidate> findByInstructorId(Long instructorId);

    List<Candidate> findByEmail(String email);

    long countByStatus(Candidate.CandidateStatus status);

    long countByChurchId(Long churchId);

    long countByChurch_ChurchName(String churchName);

    @Query("SELECT c FROM Candidate c WHERE c.church.district.id = :districtId")
    List<Candidate> findByDistrictId(@Param("districtId") Long districtId);

    @Query("SELECT c FROM Candidate c WHERE c.church.district.field.id = :fieldId")
    List<Candidate> findByFieldId(@Param("fieldId") Long fieldId);
}