package com.devscore.ai.SpringBootBackend.entity;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "submission_answers")
@Data
public class SubmissionAnswer {

    @Id
    @UuidGenerator
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String userAnswer; 

    private boolean isCorrect; 

    @ManyToOne
    @JoinColumn(name = "submission_id")
    private Submission submission;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question;
}
