package com.church.baptism.repository.lesson;

import com.church.baptism.entity.lesson.LessonQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonQuestionRepository extends JpaRepository<LessonQuestion, Long> {
    List<LessonQuestion> findByLessonIdOrderByOrderIndexAsc(Long lessonId);
    void deleteByLessonId(Long lessonId);
}
