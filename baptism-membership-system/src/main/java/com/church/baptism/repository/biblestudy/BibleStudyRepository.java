package com.church.baptism.repository.biblestudy;

import com.church.baptism.entity.biblestudy.BibleStudy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BibleStudyRepository extends JpaRepository<BibleStudy, Long> {

    List<BibleStudy> findByInstructorId(Long instructorId);

    List<BibleStudy> findByStatus(BibleStudy.BibleStudyStatus status);
}
