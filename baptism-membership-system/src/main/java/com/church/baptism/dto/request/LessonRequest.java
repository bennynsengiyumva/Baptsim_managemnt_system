package com.church.baptism.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public class LessonRequest {
    @NotBlank(message = "Lesson title is required")
    @Size(min = 1, max = 200, message = "Title must be between 1 and 200 characters")
    public String lessonTitle;

    public LocalDate lessonDate;

    @Size(max = 5000, message = "Notes cannot exceed 5000 characters")
    public String notes;

    public String fileUrl;

    @Min(value = 0, message = "Required score cannot be negative")
    @Max(value = 100, message = "Required score cannot exceed 100")
    public int requiredScore;

    @Min(value = 1, message = "Lesson order must be at least 1")
    public int lessonOrder;

    @Min(value = 1, message = "Max attempts must be at least 1")
    @Max(value = 10, message = "Max attempts cannot exceed 10")
    public int maxAttempts = 3;

    public Long candidateId;

    public Long cohortId;

    @NotNull(message = "Instructor ID is required")
    public Long instructorId;

    public Long bibleStudyId;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    public String category;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 600, message = "Duration cannot exceed 600 minutes")
    public Integer durationMinutes;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    public String description;

    public String titleRw;

    @Size(max = 5000, message = "Notes (Kinyarwanda) cannot exceed 5000 characters")
    public String notesRw;

    @Size(max = 1000, message = "Description (Kinyarwanda) cannot exceed 1000 characters")
    public String descriptionRw;

    public List<QuestionRequest> questions;

    public static class QuestionRequest {
        @NotBlank(message = "Question text is required")
        public String question;

        @NotBlank(message = "Correct answer is required")
        public String correctAnswer;

        @NotNull(message = "Options are required")
        @Size(min = 2, max = 6, message = "Must have between 2 and 6 options")
        public List<String> options;

        public int orderIndex;
    }
}
