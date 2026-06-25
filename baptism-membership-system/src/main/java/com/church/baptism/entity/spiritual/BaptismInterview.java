package com.church.baptism.entity.spiritual;

import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.instructor.Instructor;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "baptism_interview")
public class BaptismInterview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate interviewDate;

    @Column(length = 3000)
    private String feedback;

    private boolean approved;

    @ManyToOne
    private Candidate candidate;

    @ManyToOne
    private Instructor interviewer;

    public Long getId() {
        return id;
    }

    public LocalDate getInterviewDate() {
        return interviewDate;
    }

    public void setInterviewDate(LocalDate interviewDate) {
        this.interviewDate = interviewDate;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public boolean isApproved() {
        return approved;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    public Candidate getCandidate() {
        return candidate;
    }

    public void setCandidate(Candidate candidate) {
        this.candidate = candidate;
    }

    public Instructor getInterviewer() {
        return interviewer;
    }

    public void setInterviewer(Instructor interviewer) {
        this.interviewer = interviewer;
    }
}