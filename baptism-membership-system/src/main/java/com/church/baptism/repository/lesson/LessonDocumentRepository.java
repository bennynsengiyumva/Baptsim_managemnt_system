package com.church.baptism.repository.lesson;

import com.church.baptism.entity.lesson.LessonDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonDocumentRepository extends JpaRepository<LessonDocument, Long> {
    List<LessonDocument> findByLessonId(Long lessonId);
    void deleteByLessonId(Long lessonId);
}
