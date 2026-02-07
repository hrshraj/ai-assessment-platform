package com.devscore.ai.SpringBootBackend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.devscore.ai.SpringBootBackend.dto.LeaderboardEntry;
import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.entity.User;
import com.devscore.ai.SpringBootBackend.repository.UserRepository;
import com.devscore.ai.SpringBootBackend.service.AnalyticsService;
import com.devscore.ai.SpringBootBackend.service.AssessmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/recruiter")
@RequiredArgsConstructor
public class RecruiterController {

    private final AssessmentService assessmentService;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;

    @PostMapping("/create-assessment")
    public ResponseEntity<?> createAssessment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            Authentication authentication
    ) {
        System.out.println("=== CREATE ASSESSMENT ENDPOINT HIT ===");
        System.out.println("Authentication: " + authentication);

        if (authentication == null) {
            System.out.println("Auth is NULL - returning 401");
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String email = authentication.getName();
        System.out.println("Email from token: " + email);

        User recruiter = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("User role from DB: " + recruiter.getRole());

        if (recruiter.getRole() != com.devscore.ai.SpringBootBackend.entity.Role.RECRUITER) {
            System.out.println("Role mismatch - returning 403");
            return ResponseEntity.status(403).body("Only recruiters can create assessments");
        }

        Assessment assessment = assessmentService.createAssessmentFromPdf(file, recruiter, title);

        return ResponseEntity.ok("Assessment created successfully! ID: " + assessment.getId());
    }

    @GetMapping("/assessment/{id}/leaderboard")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<List<LeaderboardEntry>> getAssessmentLeaderboard(@PathVariable String id) {
        return ResponseEntity.ok(analyticsService.getLeaderboard(id));
    }
}
