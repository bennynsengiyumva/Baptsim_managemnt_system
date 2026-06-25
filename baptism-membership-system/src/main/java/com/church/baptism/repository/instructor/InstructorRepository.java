package com.church.baptism.repository.instructor;

import com.church.baptism.entity.instructor.Instructor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstructorRepository extends JpaRepository<Instructor, Long> {

    long countByActiveTrue();
    long countByChurchId(Long churchId);
    List<Instructor> findByChurchId(Long churchId);

    // Used by CandidateController to resolve instructor from JWT email
    Optional<Instructor> findByEmail(String email);
    
}