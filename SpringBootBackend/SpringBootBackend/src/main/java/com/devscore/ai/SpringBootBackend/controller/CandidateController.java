package com.devscore.ai.SpringBootBackend.controller;

import java.util.Map;

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
import com.devscore.ai.SpringBootBackend.entity.User;
import com.devscore.ai.SpringBootBackend.repository.UserRepository;
import com.devscore.ai.SpringBootBackend.service.CandidateTestService;

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

            // FIX: Return a proper JSON object, not a raw string
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
}