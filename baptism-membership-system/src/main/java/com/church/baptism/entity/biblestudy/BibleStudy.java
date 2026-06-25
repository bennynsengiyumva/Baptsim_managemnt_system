package com.church.baptism.entity.biblestudy;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.instructor.Instructor;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "bible_studies")
@Getter
@Setter
public class BibleStudy extends AuditableEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private Instructor instructor;

    private String chapter;
    private String verse;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime schedule;
    private Integer duration;

    @Enumerated(EnumType.STRING)
    private BibleStudyStatus status = BibleStudyStatus.SCHEDULED;

    @ManyToMany
    @JoinTable(
        name = "bible_study_participants",
        joinColumns = @JoinColumn(name = "bible_study_id"),
        inverseJoinColumns = @JoinColumn(name = "candidate_id")
    )
    private Set<Candidate> participants = new HashSet<>();

    public enum BibleStudyStatus {
        SCHEDULED, ONGOING, COMPLETED, CANCELLED
    }
}
