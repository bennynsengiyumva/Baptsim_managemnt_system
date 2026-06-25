package com.church.baptism.repository.lesson;

import com.church.baptism.entity.lesson.LessonAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface LessonAnswerRepository extends JpaRepository<LessonAnswer, Long> {
    @Modifying
    @Query("DELETE FROM LessonAnswer a WHERE a.question.id IN (SELECT q.id FROM LessonQuestion q WHERE q.lesson.id = :lessonId)")
    void deleteByLessonId(Long lessonId);
}
