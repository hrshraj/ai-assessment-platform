package com.devscore.ai.SpringBootBackend.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devscore.ai.SpringBootBackend.dto.LeaderboardEntry;
import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.entity.User;
import com.devscore.ai.SpringBootBackend.repository.AssessmentRepository;
import com.devscore.ai.SpringBootBackend.repository.UserRepository;
import com.devscore.ai.SpringBootBackend.service.AnalyticsService;
import com.devscore.ai.SpringBootBackend.service.AssessmentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/recruiter")
@RequiredArgsConstructor
@Slf4j
public class RecruiterController {

    private final AssessmentService assessmentService;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final AssessmentRepository assessmentRepository;

    /**
     * Create assessment from job description TEXT (JSON body, no multipart)
     */
    @PostMapping("/create-assessment")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> createAssessment(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            User recruiter = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String title = body.getOrDefault("title", "Untitled Assessment");
            String jobDescription = body.getOrDefault("jobDescription", "");

            if (jobDescription.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Job description is required"));
            }

            Assessment assessment = assessmentService.createAssessmentFromText(jobDescription, recruiter, title);

            return ResponseEntity.ok(Map.of(
                "message", "Assessment created successfully!",
                "assessmentId", assessment.getId(),
                "title", assessment.getTitle(),
                "questionCount", assessment.getQuestions() != null ? assessment.getQuestions().size() : 0
            ));
        } catch (Exception e) {
            log.error("Failed to create assessment", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create assessment: " + e.getMessage()));
        }
    }

    /**
     * List all assessments created by this recruiter
     */
    @GetMapping("/assessments")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> getMyAssessments(Authentication authentication) {
        String email = authentication.getName();
        User recruiter = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Assessment> assessments = assessmentRepository.findByRecruiterId(recruiter.getId());

        List<Map<String, Object>> result = assessments.stream().map(a -> Map.<String, Object>of(
            "id", a.getId(),
            "title", a.getTitle(),
            "durationMinutes", a.getDurationMinutes(),
            "questionCount", a.getQuestions() != null ? a.getQuestions().size() : 0,
            "createdAt", a.getCreatedAt().toString()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/assessment/{id}/leaderboard")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<List<LeaderboardEntry>> getAssessmentLeaderboard(@PathVariable String id) {
        return ResponseEntity.ok(analyticsService.getLeaderboard(id));
    }
}
