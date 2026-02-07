package com.devscore.ai.SpringBootBackend.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "submissions")
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Submission {

    @Id
    @UuidGenerator
    private String id;

    private Integer score; 
    
    private LocalDateTime submittedAt;

    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    private User candidate;

    @ManyToOne
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL)
    private List<SubmissionAnswer> answers;
}
