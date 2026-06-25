package com.church.baptism.repository.lesson;

import com.church.baptism.entity.lesson.LessonAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface LessonAttemptRepository extends JpaRepository<LessonAttempt, Long> {
    List<LessonAttempt> findByLessonIdAndCandidateIdOrderByAttemptNumberAsc(Long lessonId, Long candidateId);
    int countByLessonIdAndCandidateId(Long lessonId, Long candidateId);
    Optional<LessonAttempt> findTopByLessonIdAndCandidateIdOrderByAttemptNumberDesc(Long lessonId, Long candidateId);

    @Modifying
    @Query("DELETE FROM LessonAttempt a WHERE a.lesson.id = :lessonId")
    void deleteByLessonId(Long lessonId);
}
