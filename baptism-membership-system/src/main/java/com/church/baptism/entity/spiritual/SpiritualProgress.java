package com.church.baptism.entity.spiritual;

import com.church.baptism.entity.candidate.Candidate;
import jakarta.persistence.*;

@Entity
@Table(name = "spiritual_progress")
public class SpiritualProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int prayerScore;

    private int scriptureReadingScore;

    private int churchParticipationScore;

    @Column(length = 3000)
    private String mentorNotes;

    @Enumerated(EnumType.STRING)
    private ReadinessStatus readinessStatus;

    @ManyToOne
    private Candidate candidate;

    public Long getId() {
        return id;
    }

    public int getPrayerScore() {
        return prayerScore;
    }

    public void setPrayerScore(int prayerScore) {
        this.prayerScore = prayerScore;
    }

    public int getScriptureReadingScore() {
        return scriptureReadingScore;
    }

    public void setScriptureReadingScore(int scriptureReadingScore) {
        this.scriptureReadingScore = scriptureReadingScore;
    }

    public int getChurchParticipationScore() {
        return churchParticipationScore;
    }

    public void setChurchParticipationScore(int churchParticipationScore) {
        this.churchParticipationScore = churchParticipationScore;
    }

    public String getMentorNotes() {
        return mentorNotes;
    }

    public void setMentorNotes(String mentorNotes) {
        this.mentorNotes = mentorNotes;
    }

    public ReadinessStatus getReadinessStatus() {
        return readinessStatus;
    }

    public void setReadinessStatus(ReadinessStatus readinessStatus) {
        this.readinessStatus = readinessStatus;
    }

    public Candidate getCandidate() {
        return candidate;
    }

    public void setCandidate(Candidate candidate) {
        this.candidate = candidate;
    }
}