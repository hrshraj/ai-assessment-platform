package com.devscore.ai.SpringBootBackend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.devscore.ai.SpringBootBackend.dto.LeaderboardEntry;
import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.entity.Submission;
import com.devscore.ai.SpringBootBackend.entity.User;
import com.devscore.ai.SpringBootBackend.repository.AssessmentRepository;
import com.devscore.ai.SpringBootBackend.repository.ProctorLogRepository;
import com.devscore.ai.SpringBootBackend.repository.SubmissionRepository;
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
    private final AssessmentRepository assessmentRepository;
    private final SubmissionRepository submissionRepository;
    private final ProctorLogRepository proctorLogRepository;
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

    @PostMapping("/create-assessment-json")
    public ResponseEntity<?> createAssessmentJson(
            @RequestBody Map<String, Object> request,
            Authentication authentication
    ) {
        System.out.println("=== CREATE ASSESSMENT JSON ENDPOINT HIT ===");
        System.out.println("Authentication: " + authentication);

        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String email = authentication.getName();
        User recruiter = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (recruiter.getRole() != com.devscore.ai.SpringBootBackend.entity.Role.RECRUITER) {
            return ResponseEntity.status(403).body("Only recruiters can create assessments");
        }

        String jobDescription = (String) request.get("jobDescription");
        String title = (String) request.getOrDefault("title", "Assessment - " + java.time.LocalDate.now());
        int questionCount = 8; // default
        if (request.get("questionCount") != null) {
            questionCount = ((Number) request.get("questionCount")).intValue();
        }
        int durationMinutes = 60; // default
        if (request.get("durationMinutes") != null) {
            durationMinutes = ((Number) request.get("durationMinutes")).intValue();
        }

        Assessment assessment = assessmentService.createAssessmentFromText(jobDescription, recruiter, title, questionCount, durationMinutes);

        return ResponseEntity.ok("Assessment created successfully! ID: " + assessment.getId());
    }

    @PostMapping("/test-auth")
    public ResponseEntity<?> testAuth(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        System.out.println("=== TEST AUTH HIT === auth=" + authentication);
        if (authentication == null) {
            return ResponseEntity.ok("Auth is null - no user authenticated");
        }
        return ResponseEntity.ok("Authenticated as: " + authentication.getName() + " authorities: " + authentication.getAuthorities());
    }

    @GetMapping("/assessments")
    public ResponseEntity<?> getRecruiterAssessments(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        String email = authentication.getName();
        User recruiter = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Assessment> assessments = assessmentRepository.findByRecruiterOrderByCreatedAtDesc(recruiter);
        List<Map<String, Object>> result = assessments.stream().map(a -> {
            Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("id", a.getId());
            map.put("title", a.getTitle());
            map.put("durationMinutes", a.getDurationMinutes());
            map.put("createdAt", a.getCreatedAt());
            map.put("questionCount", a.getQuestions() != null ? a.getQuestions().size() : 0);
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        String email = authentication.getName();
        User recruiter = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Assessment> assessments = assessmentRepository.findByRecruiterOrderByCreatedAtDesc(recruiter);
        int totalAssessments = assessments.size();
        int totalQuestions = assessments.stream()
                .mapToInt(a -> a.getQuestions() != null ? a.getQuestions().size() : 0)
                .sum();

        Map<String, Object> stats = new java.util.LinkedHashMap<>();
        stats.put("totalAssessments", totalAssessments);
        stats.put("totalQuestions", totalQuestions);

        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/assessment/{id}")
    @Transactional
    public ResponseEntity<?> deleteAssessment(
            @PathVariable String id,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String email = authentication.getName();
        User recruiter = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assessment assessment = assessmentRepository.findById(id).orElse(null);
        if (assessment == null) {
            return ResponseEntity.status(404).body("Assessment not found");
        }

        // Ensure only the owner can delete
        if (!assessment.getRecruiter().getId().equals(recruiter.getId())) {
            return ResponseEntity.status(403).body("You can only delete your own assessments");
        }

        // Delete related submissions (and their proctor logs + answers via cascade)
        List<Submission> submissions = submissionRepository.findByAssessmentId(id);
        for (Submission sub : submissions) {
            proctorLogRepository.deleteBySubmissionId(sub.getId());
        }
        submissionRepository.deleteAll(submissions);

        // Delete assessment (questions cascade automatically)
        assessmentRepository.delete(assessment);

        return ResponseEntity.ok("Assessment deleted successfully");
    }

    @GetMapping("/assessment/{id}/leaderboard")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<List<LeaderboardEntry>> getAssessmentLeaderboard(@PathVariable String id) {
        return ResponseEntity.ok(analyticsService.getLeaderboard(id));
    }
}
