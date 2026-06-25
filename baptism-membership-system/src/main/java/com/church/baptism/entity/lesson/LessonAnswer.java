package com.church.baptism.entity.lesson;

import com.church.baptism.entity.candidate.Candidate;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class LessonAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String selectedAnswer;

    private boolean correct;

    @ManyToOne
    private LessonQuestion question;

    @ManyToOne
    private Candidate candidate;
}