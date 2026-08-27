package com.church.baptism.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    public int candidateScore;
    public int lessonOrder;
    public int maxAttempts;
    public boolean completed;
    public String status;
    public LocalDateTime startedAt;
    public LocalDateTime completedAt;
    public int completionPercentage;
    public String category;
    public Integer durationMinutes;
    public String description;
    public String titleRw;
    public String notesRw;
    public String descriptionRw;
    public String displayTitle;
    public String displayNotes;
    public String displayDescription;
    public List<QuestionResponse> questions;

    public static class QuestionResponse {
        public Long id;
        public String question;
        public List<String> options;
        public int orderIndex;
        public String correctAnswer;
    }
}
