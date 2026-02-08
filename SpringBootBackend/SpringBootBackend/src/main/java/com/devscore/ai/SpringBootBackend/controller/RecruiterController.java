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

    /**
     * Get integrity report for a submission (proctor logs: snapshots + events).
     */
    @GetMapping("/submission/{submissionId}/integrity")
    public ResponseEntity<?> getIntegrityReport(@PathVariable String submissionId) {
        var submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Submission not found"));
        }

        var logs = proctorLogRepository.findBySubmissionIdOrderByTimestampAsc(submissionId);

        // Build snapshots from SNAPSHOT type logs
        List<Map<String, Object>> snapshots = new java.util.ArrayList<>();
        List<Map<String, Object>> events = new java.util.ArrayList<>();
        java.time.LocalDateTime startTime = logs.isEmpty() ? null : logs.get(0).getTimestamp();

        for (var log : logs) {
            long timeOffset = startTime != null && log.getTimestamp() != null
                    ? java.time.Duration.between(startTime, log.getTimestamp()).getSeconds()
                    : 0;

            if (log.getLogType() == com.devscore.ai.SpringBootBackend.entity.ProctorLog.LogType.SNAPSHOT) {
                Map<String, Object> snap = new java.util.LinkedHashMap<>();
                snap.put("id", log.getId());
                snap.put("image", log.getSnapshotBase64() != null
                        ? (log.getSnapshotBase64().startsWith("data:") ? log.getSnapshotBase64() : "data:image/png;base64," + log.getSnapshotBase64())
                        : null);
                snap.put("timestamp", log.getTimestamp() != null ? log.getTimestamp().toString() : null);
                snap.put("timeOffset", timeOffset);
                snap.put("reason", "Periodic Capture");
                snapshots.add(snap);
            } else if (log.getLogType() == com.devscore.ai.SpringBootBackend.entity.ProctorLog.LogType.REPLAY) {
                // rrweb events stored as JSON in activityLogJson
                if (log.getActivityLogJson() != null) {
                    try {
                        var objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        var parsed = objectMapper.readValue(log.getActivityLogJson(), List.class);
                        events.addAll(parsed);
                    } catch (Exception e) {
                        // Single event object
                        try {
                            var objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                            var parsed = objectMapper.readValue(log.getActivityLogJson(), Map.class);
                            events.add(parsed);
                        } catch (Exception e2) {
                            // skip unparseable
                        }
                    }
                }
            } else {
                // TAB_SWITCH, BLUR, ANOMALY, FULL_SCREEN_EXIT → add as flagged snapshots
                if (log.getSnapshotBase64() != null) {
                    Map<String, Object> snap = new java.util.LinkedHashMap<>();
                    snap.put("id", log.getId());
                    snap.put("image", log.getSnapshotBase64().startsWith("data:") ? log.getSnapshotBase64() : "data:image/png;base64," + log.getSnapshotBase64());
                    snap.put("timestamp", log.getTimestamp() != null ? log.getTimestamp().toString() : null);
                    snap.put("timeOffset", timeOffset);
                    snap.put("reason", "Suspect: " + log.getLogType().name());
                    snapshots.add(snap);
                }
            }
        }

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("submissionId", submissionId);
        result.put("integrityScore", submission.getIntegrityScore());
        result.put("snapshots", snapshots);
        result.put("events", events);

        return ResponseEntity.ok(result);
    }
}
