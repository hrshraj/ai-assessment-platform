package com.devscore.ai.SpringBootBackend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devscore.ai.SpringBootBackend.dto.SubmissionRequest;
import com.devscore.ai.SpringBootBackend.dto.TestResponseDto;
import com.devscore.ai.SpringBootBackend.entity.Submission;
import com.devscore.ai.SpringBootBackend.entity.User;
import com.devscore.ai.SpringBootBackend.repository.SubmissionRepository;
import com.devscore.ai.SpringBootBackend.repository.UserRepository;
import com.devscore.ai.SpringBootBackend.service.CandidateTestService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/candidate")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CANDIDATE')")
@Slf4j
public class CandidateController {

    private final CandidateTestService testService;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;

    /**
     * Start Test: Fetches questions for the assessment.
     */
    @GetMapping("/test/{assessmentId}/start")
    public ResponseEntity<?> startTest(@PathVariable String assessmentId) {
        try {
            TestResponseDto testDto = testService.startTest(assessmentId);
            return ResponseEntity.ok(testDto);
        } catch (RuntimeException e) {
            log.error("Error starting test: ", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Submit Test: Saves answers and triggers AI evaluation.
     */
    @PostMapping("/submit")
    public ResponseEntity<?> submitTest(@RequestBody SubmissionRequest request, Authentication auth) {
        try {
            String email = auth.getName();
            User candidate = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String submissionId = testService.submitTest(request, candidate);

            return ResponseEntity.ok(Map.of(
                "message", "Test submitted successfully. Evaluation in progress.",
                "submissionId", submissionId,
                "status", "SUBMITTED"
            ));

        } catch (Exception e) {
            log.error("Submission failed: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Submission failed: " + e.getMessage()));
        }
    }

    /**
     * Get candidate's past submissions / dashboard data
     */
    @GetMapping("/submissions")
    public ResponseEntity<?> getMySubmissions(Authentication auth) {
        try {
            String email = auth.getName();
            User candidate = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Submission> submissions = submissionRepository.findByCandidateIdOrderBySubmittedAtDesc(candidate.getId());

            List<Map<String, Object>> result = submissions.stream().map(s -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("submissionId", s.getId());
                entry.put("assessmentId", s.getAssessment().getId());
                entry.put("assessmentTitle", s.getAssessment().getTitle());
                entry.put("score", s.getScore());
                entry.put("submittedAt", s.getSubmittedAt() != null ? s.getSubmittedAt().toString() : null);
                entry.put("aiFeedback", s.getAiFeedback());
                entry.put("integrityScore", s.getIntegrityScore());

                if (s.getSkillScoresJson() != null) {
                    try {
                        entry.put("skillScores", objectMapper.readValue(s.getSkillScoresJson(), new TypeReference<Map<String, Object>>(){}));
                    } catch (Exception e) { entry.put("skillScores", Map.of()); }
                }
                if (s.getStrengthsJson() != null) {
                    try {
                        entry.put("strengths", objectMapper.readValue(s.getStrengthsJson(), new TypeReference<List<String>>(){}));
                    } catch (Exception e) { entry.put("strengths", List.of()); }
                }
                if (s.getWeaknessesJson() != null) {
                    try {
                        entry.put("weaknesses", objectMapper.readValue(s.getWeaknessesJson(), new TypeReference<List<String>>(){}));
                    } catch (Exception e) { entry.put("weaknesses", List.of()); }
                }
                return entry;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to get submissions", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
