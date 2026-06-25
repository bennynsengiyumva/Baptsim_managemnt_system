package com.church.baptism.entity.spiritual;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.candidate.Candidate;
import jakarta.persistence.*;

@Entity
@Table(name = "spiritual_preparations")
public class SpiritualPreparation extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;

    private int worshipAttendance;

    private int prayerMeetings;

    private int bibleReadingScore;

    private int characterAssessment;

    private String prayerRequest;

    private String testimony;

    private String mentorNotes;

    private boolean readyForBaptism = false;

    private double readinessScore;

    // ===== AUTO READINESS CALCULATION =====

    public void calculateReadiness() {

        readinessScore =
                (worshipAttendance * 0.30)
              + (prayerMeetings * 0.20)
              + (bibleReadingScore * 0.25)
              + (characterAssessment * 0.25);

        readyForBaptism = readinessScore >= 70;
    }

    // ===== GETTERS & SETTERS =====

    public Candidate getCandidate() {
        return candidate;
    }

    public void setCandidate(Candidate candidate) {
        this.candidate = candidate;
    }

    public int getWorshipAttendance() {
        return worshipAttendance;
    }

    public void setWorshipAttendance(int worshipAttendance) {
        this.worshipAttendance = worshipAttendance;
    }

    public int getPrayerMeetings() {
        return prayerMeetings;
    }

    public void setPrayerMeetings(int prayerMeetings) {
        this.prayerMeetings = prayerMeetings;
    }

    public int getBibleReadingScore() {
        return bibleReadingScore;
    }

    public void setBibleReadingScore(int bibleReadingScore) {
        this.bibleReadingScore = bibleReadingScore;
    }

    public int getCharacterAssessment() {
        return characterAssessment;
    }

    public void setCharacterAssessment(int characterAssessment) {
        this.characterAssessment = characterAssessment;
    }

    public String getPrayerRequest() {
        return prayerRequest;
    }

    public void setPrayerRequest(String prayerRequest) {
        this.prayerRequest = prayerRequest;
    }

    public String getTestimony() {
        return testimony;
    }

    public void setTestimony(String testimony) {
        this.testimony = testimony;
    }

    public String getMentorNotes() {
        return mentorNotes;
    }

    public void setMentorNotes(String mentorNotes) {
        this.mentorNotes = mentorNotes;
    }

    public boolean isReadyForBaptism() {
        return readyForBaptism;
    }

    public void setReadyForBaptism(boolean readyForBaptism) {
        this.readyForBaptism = readyForBaptism;
    }

    public double getReadinessScore() {
        return readinessScore;
    }

    public void setReadinessScore(double readinessScore) {
        this.readinessScore = readinessScore;
    }
}