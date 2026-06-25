package com.church.baptism.entity.lesson;

import com.church.baptism.entity.candidate.Candidate;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_attempts")
public class LessonAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Lesson lesson;

    @ManyToOne
    private Candidate candidate;

    private int attemptNumber;

    private int score;

    private boolean passed;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }

    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }

    public int getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(int attemptNumber) { this.attemptNumber = attemptNumber; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
