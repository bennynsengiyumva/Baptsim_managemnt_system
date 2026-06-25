package com.church.baptism.dto.response;

import java.time.LocalDate;
import java.util.List;

public class LessonResponse {
    public Long id;
    public String lessonTitle;
    public LocalDate lessonDate;
    public String notes;
    public String documentUrl;
    public String candidateName;
    public Long candidateId;
    public String instructorName;
    public Long instructorId;
    public Long bibleStudyId;
    public String bibleStudyTitle;
    public int requiredScore;
    public int studentScore;
    public int lessonOrder;
    public int maxAttempts;
    public boolean completed;
    public List<QuestionResponse> questions;

    public static class QuestionResponse {
        public Long id;
        public String question;
        public List<String> options;
        public int orderIndex;
        public String correctAnswer;
    }
}
