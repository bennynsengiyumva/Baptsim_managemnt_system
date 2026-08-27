package com.church.baptism.repository.cohort;

import com.church.baptism.entity.cohort.Cohort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CohortRepository extends JpaRepository<Cohort, Long> {
    List<Cohort> findByInstructorId(Long instructorId);
    List<Cohort> findByChurchId(Long churchId);
    List<Cohort> findByStatus(Cohort.CohortStatus status);
    List<Cohort> findByInstructorIdAndStatus(Long instructorId, Cohort.CohortStatus status);
    List<Cohort> findByChurchIdAndStatus(Long churchId, Cohort.CohortStatus status);
    boolean existsByCohortCode(String cohortCode);
}
