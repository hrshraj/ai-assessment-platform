package com.devscore.ai.SpringBootBackend.entity;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "questions")
@Data
public class Question {

    @Id
    @UuidGenerator
    private String id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    private QuestionType type;

    @Column(columnDefinition = "TEXT")
    private String optionsJson; 

    @Column(columnDefinition = "TEXT")
    private String correctAnswer; 

    private Integer scoreWeight; 

    // FIX 1: Store the Rubric and Expected Answer so we can send it back for grading later

    @Column(columnDefinition = "TEXT")
    private String rubricJson; // Stores {"clarity": 2, "accuracy": 3}

    @Column(columnDefinition = "TEXT")
    private String expectedAnswerJson;

    @ManyToOne
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    public enum QuestionType {
        MCQ,
        SUBJECTIVE,
        CODING
    }
}
