package com.church.baptism.dto.request;

import java.time.LocalDate;
import java.util.List;

public class LessonRequest {
    public String lessonTitle;
    public LocalDate lessonDate;
    public String notes;
    public String fileUrl;
    public int requiredScore;
    public int lessonOrder;
    public int maxAttempts = 3;
    public Long candidateId;
    public Long instructorId;
    public Long bibleStudyId;
    public List<QuestionRequest> questions;

    public static class QuestionRequest {
        public String question;
        public String correctAnswer;
        public List<String> options;
        public int orderIndex;
    }
}
