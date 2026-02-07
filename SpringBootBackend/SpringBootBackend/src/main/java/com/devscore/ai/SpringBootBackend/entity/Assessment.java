package com.devscore.ai.SpringBootBackend.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;
import lombok.Data;

@Entity
@Table(name = "assessments")
@Data
public class Assessment {

    @Id
    @UuidGenerator
    private String id;

    private String title; 

    @Column(columnDefinition = "TEXT")
    private String jobDescriptionText; 

    private Integer durationMinutes; 

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "recruiter_id", nullable = false)
    private User recruiter;

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions;
}
