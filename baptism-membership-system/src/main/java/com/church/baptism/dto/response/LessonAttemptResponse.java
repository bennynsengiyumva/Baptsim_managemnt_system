package com.church.baptism.dto.response;

import java.time.LocalDateTime;

public class LessonAttemptResponse {
    public Long id;
    public Long lessonId;
    public String lessonTitle;
    public Long candidateId;
    public int attemptNumber;
    public int score;
    public boolean passed;
    public int attemptsRemaining;
    public LocalDateTime startedAt;
    public LocalDateTime completedAt;
}
