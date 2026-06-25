package com.church.baptism.entity.lesson;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.biblestudy.BibleStudy;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.instructor.Instructor;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "lessons")
public class Lesson extends AuditableEntity {

    private String lessonTitle;

    private LocalDate lessonDate;

    @Column(length = 2000)
    private String notes;

    private String documentUrl;

    private int requiredScore;

    private int obtainedScore;

    private boolean completed;

    private int lessonOrder;

    private int maxAttempts = 3;

    @ManyToOne
    private Candidate candidate;

    @ManyToOne
    private Instructor instructor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bible_study_id")
    private BibleStudy bibleStudy;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LessonQuestion> questions;

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

    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }

    public Instructor getInstructor() { return instructor; }
    public void setInstructor(Instructor instructor) { this.instructor = instructor; }

    public BibleStudy getBibleStudy() { return bibleStudy; }
    public void setBibleStudy(BibleStudy bibleStudy) { this.bibleStudy = bibleStudy; }

    public List<LessonQuestion> getQuestions() { return questions; }
    public void setQuestions(List<LessonQuestion> questions) { this.questions = questions; }
}
