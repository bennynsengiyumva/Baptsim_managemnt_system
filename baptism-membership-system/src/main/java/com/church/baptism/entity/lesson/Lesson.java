package com.church.baptism.entity.lesson;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.biblestudy.BibleStudy;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.cohort.Cohort;
import com.church.baptism.entity.instructor.Instructor;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "lessons")
public class Lesson extends AuditableEntity {

    private String lessonTitle;

    private LocalDate lessonDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String documentUrl;

    private int requiredScore;

    private int obtainedScore;

    private boolean completed;

    private int lessonOrder;

    private int maxAttempts = 3;

    @Enumerated(EnumType.STRING)
    private LessonStatus status = LessonStatus.NOT_STARTED;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private int completionPercentage;

    private String category;

    private Integer durationMinutes;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String titleRw;

    @Column(columnDefinition = "TEXT")
    private String notesRw;

    @Column(columnDefinition = "TEXT")
    private String descriptionRw;

    @ManyToOne
    private Candidate candidate;

    @ManyToOne
    private Instructor instructor;

    @ManyToOne
    @JoinColumn(name = "cohort_id")
    private Cohort cohort;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bible_study_id")
    private BibleStudy bibleStudy;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LessonQuestion> questions;

    public enum LessonStatus {
        NOT_STARTED,
        IN_PROGRESS,
        COMPLETED
    }

    public String getLessonTitle() { return lessonTitle; }
    public void setLessonTitle(String lessonTitle) { this.lessonTitle = lessonTitle; }

    public LocalDate getLessonDate() { return lessonDate; }
    public void setLessonDate(LocalDate lessonDate) { this.lessonDate = lessonDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getDocumentUrl() { return documentUrl; }
    public void setDocumentUrl(String documentUrl) { this.documentUrl = documentUrl; }

    public int getRequiredScore() { return requiredScore; }
    public void setRequiredScore(int requiredScore) { this.requiredScore = requiredScore; }

    public int getObtainedScore() { return obtainedScore; }
    public void setObtainedScore(int obtainedScore) { this.obtainedScore = obtainedScore; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public int getLessonOrder() { return lessonOrder; }
    public void setLessonOrder(int lessonOrder) { this.lessonOrder = lessonOrder; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }

    public LessonStatus getStatus() { return status; }
    public void setStatus(LessonStatus status) { this.status = status; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public int getCompletionPercentage() { return completionPercentage; }
    public void setCompletionPercentage(int completionPercentage) { this.completionPercentage = completionPercentage; }

    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }

    public Instructor getInstructor() { return instructor; }
    public void setInstructor(Instructor instructor) { this.instructor = instructor; }

    public Cohort getCohort() { return cohort; }
    public void setCohort(Cohort cohort) { this.cohort = cohort; }

    public BibleStudy getBibleStudy() { return bibleStudy; }
    public void setBibleStudy(BibleStudy bibleStudy) { this.bibleStudy = bibleStudy; }

    public List<LessonQuestion> getQuestions() { return questions; }
    public void setQuestions(List<LessonQuestion> questions) { this.questions = questions; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTitleRw() { return titleRw; }
    public void setTitleRw(String titleRw) { this.titleRw = titleRw; }

    public String getNotesRw() { return notesRw; }
    public void setNotesRw(String notesRw) { this.notesRw = notesRw; }

    public String getDescriptionRw() { return descriptionRw; }
    public void setDescriptionRw(String descriptionRw) { this.descriptionRw = descriptionRw; }
}
