package com.church.baptism.repository.lesson;

import com.church.baptism.entity.lesson.Lesson;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCandidateId(Long candidateId);
    List<Lesson> findByCandidateIdOrderByLessonOrderAsc(Long candidateId);
    List<Lesson> findByInstructorId(Long instructorId);
    List<Lesson> findByCandidateIdAndCompleted(Long candidateId, boolean completed);
    List<Lesson> findByCandidate_Church_ChurchName(String churchName);
    List<Lesson> findByBibleStudyId(Long bibleStudyId);

    @EntityGraph(attributePaths = {"questions", "questions.options"})
    List<Lesson> findByCohortId(Long cohortId);

    List<Lesson> findByCohortIdAndCandidateId(Long cohortId, Long candidateId);
}
