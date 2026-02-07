package com.devscore.ai.SpringBootBackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.UuidGenerator;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Submission {

    @Id
    @UuidGenerator
    private String id;

    @ManyToOne
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    @ManyToOne
    @JoinColumn(name = "candidate_id")
    private User candidate;

    private LocalDateTime submittedAt;

    private Integer score; // Total Score

    // --- NEW FIELDS FOR RECRUITER DASHBOARD (Source 6.4) ---
    @Column(columnDefinition = "TEXT")
    private String aiFeedback; // "Overall, the candidate is strong in..."

    @Column(columnDefinition = "TEXT") // Store as JSON string: {"Java": 80.0, "Spring": 40.0}
    private String skillScoresJson; 

    @Column(columnDefinition = "TEXT") // Store as JSON string: ["Strong OOP", "Weak Error Handling"]
    private String strengthsJson;

    @Column(columnDefinition = "TEXT") // Store as JSON string: ["Needs work on optimization"]
    private String weaknessesJson;

    // --- NEW FIELDS FOR PROCTORING (Source 8.2) ---
    private Double integrityScore; // 0-100

    @Column(columnDefinition = "TEXT")
    private String integrityFlagsJson; // ["Tab Switch detected", "Low Face confidence"]
    
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL)
    private List<SubmissionAnswer> answers;

    @Column(columnDefinition = "TEXT")
    private String browserEventsJson;

    // In Submission.java
@ElementCollection
private List<Long> codeFingerprint; // Store the 128 integers
}