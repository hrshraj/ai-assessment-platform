package com.devscore.ai.SpringBootBackend.controller;

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

@RestController
@RequestMapping("/api/candidate")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CANDIDATE')")
public class CandidateController {

    private final CandidateTestService testService;
    private final UserRepository userRepository;

    @GetMapping("/test/{assessmentId}/start")
    public ResponseEntity<TestResponseDto> startTest(@PathVariable String assessmentId) {
        return ResponseEntity.ok(testService.startTest(assessmentId));
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitTest(@RequestBody SubmissionRequest request, Authentication auth) {
        String email = auth.getName();
        User candidate = userRepository.findByEmail(email).orElseThrow();

        String submissionId = testService.submitTest(request, candidate);
        return ResponseEntity.ok("Submission Saved! ID: " + submissionId);
    }
}
