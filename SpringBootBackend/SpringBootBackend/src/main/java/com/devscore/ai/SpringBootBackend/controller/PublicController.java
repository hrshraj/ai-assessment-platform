package com.devscore.ai.SpringBootBackend.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.repository.AssessmentRepository;
import com.devscore.ai.SpringBootBackend.repository.SubmissionRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final AssessmentRepository assessmentRepository;
    private final SubmissionRepository submissionRepository;

    /**
     * List all available assessments for candidates to browse
     */
    @GetMapping("/assessments")
    public ResponseEntity<?> listAssessments() {
        List<Assessment> assessments = assessmentRepository.findAll();

        List<Map<String, Object>> result = assessments.stream().map(a -> {
            long applicantCount = submissionRepository.countByAssessmentId(a.getId());
            return Map.<String, Object>of(
                "id", a.getId(),
                "title", a.getTitle(),
                "company", a.getRecruiter().getCompanyName() != null ? a.getRecruiter().getCompanyName() : "Unknown",
                "recruiterName", a.getRecruiter().getFullName(),
                "durationMinutes", a.getDurationMinutes(),
                "questionCount", a.getQuestions() != null ? a.getQuestions().size() : 0,
                "applicants", applicantCount,
                "createdAt", a.getCreatedAt().toString()
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
