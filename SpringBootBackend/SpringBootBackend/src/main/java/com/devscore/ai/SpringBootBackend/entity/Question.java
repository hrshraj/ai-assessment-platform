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
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    private QuestionType type;

    @Column(columnDefinition = "TEXT")
    private String optionsJson; 

    @Column(columnDefinition = "TEXT")
    private String correctAnswer; 

    private Integer scoreWeight; 

    @ManyToOne
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    public enum QuestionType {
        MCQ,
        SUBJECTIVE,
        CODING
    }
}
