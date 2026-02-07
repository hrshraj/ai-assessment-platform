package com.devscore.ai.SpringBootBackend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devscore.ai.SpringBootBackend.dto.SubmissionRequest;
import com.devscore.ai.SpringBootBackend.dto.TestResponseDto;
import com.devscore.ai.SpringBootBackend.dto.ai.EvaluationResponse;
import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.entity.Question;
import com.devscore.ai.SpringBootBackend.entity.Submission;
import com.devscore.ai.SpringBootBackend.entity.SubmissionAnswer;
import com.devscore.ai.SpringBootBackend.entity.User;
import com.devscore.ai.SpringBootBackend.repository.AssessmentRepository;
import com.devscore.ai.SpringBootBackend.repository.QuestionRepository;
import com.devscore.ai.SpringBootBackend.repository.SubmissionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateTestService {

    private final AssessmentRepository assessmentRepository;
    private final SubmissionRepository submissionRepository;
    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper; // Automatically injected by Spring Boot
    private final AiIntegrationService aiIntegrationService;

    /**
     * Start Test: Fetches questions and parses options for the frontend.
     */
    public TestResponseDto startTest(String assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        List<TestResponseDto.QuestionDto> questionDtos = assessment.getQuestions().stream()
                .map(q -> {
                    List<String> options = new ArrayList<>();
                    try {
                        String json = q.getOptionsJson();
                        if (json != null && !json.isBlank()) {
                            // Support legacy "|||" split if you used it before
                            if (json.contains("|||")) {
                                String[] opts = json.split("\\|\\|\\|");
                                Collections.addAll(options, opts);
                            } else {
                                // Proper JSON parsing (Standard way)
                                // Note: Adjust TypeReference if your Python AI saves complex objects
                                try {
                                    options = objectMapper.readValue(json, new TypeReference<List<String>>() {});
                                } catch (Exception e) {
                                    // Fallback if AI saved it as a raw string or complex object
                                    options.add(json); 
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error parsing options for question: " + q.getId(), e);
                    }

                    return new TestResponseDto.QuestionDto(
                            String.valueOf(q.getId()), // ID is now String (UUID)
                            q.getQuestionText(),
                            q.getType().name(),
                            options
                    );
                })
                .collect(Collectors.toList());

        return new TestResponseDto(
                assessment.getId(),
                assessment.getTitle(),
                assessment.getDurationMinutes(),
                questionDtos
        );
    }

    /**
     * Submit Test: Saves answers and prepares for AI evaluation.
     */
@Transactional
    public String submitTest(SubmissionRequest request, User candidate) {
        // 1. Validation & Setup
        Assessment assessment = assessmentRepository.findById(request.assessmentId())
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        Submission submission = Submission.builder()
                .assessment(assessment)
                .candidate(candidate)
                .submittedAt(LocalDateTime.now())
                .score(0) // Temporary score
                .build();
        
        // 2. Save Initial Answers
        List<SubmissionAnswer> answerEntities = new ArrayList<>();
        for (SubmissionRequest.AnswerDto answerDto : request.answers()) {
            Question question = questionRepository.findById(answerDto.questionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            SubmissionAnswer subAnswer = new SubmissionAnswer();
            subAnswer.setSubmission(submission);
            subAnswer.setQuestion(question);
            
            String input = (question.getType() == Question.QuestionType.MCQ) 
                 ? answerDto.selectedOption() : answerDto.codeAnswer();
            
            subAnswer.setUserAnswer(input);
            subAnswer.setCorrect(false); 
            answerEntities.add(subAnswer);
        }
        submission.setAnswers(answerEntities);
        
        // Save first to generate the ID (needed by Python)
        Submission savedSubmission = submissionRepository.save(submission);
        log.info("Submission saved locally with ID: {}", savedSubmission.getId());

        // 3. Trigger AI Evaluation (Synchronous for MVP)
        // This ensures the leaderboard is updated immediately after the user clicks submit.
        try {
            EvaluationResponse aiResult = aiIntegrationService.evaluateSubmission(savedSubmission.getId());
            
            // 4. Update Database with AI Results
            if (aiResult != null) {
                // Cast Double to Integer (or change Entity to use Double)
                int finalScore = aiResult.totalScore().intValue(); 
                savedSubmission.setScore(finalScore);
                
                // Optional: You could save feedback/integrity flags here if you add fields to Submission entity
                // savedSubmission.setAiFeedback(aiResult.overallFeedback());
                
                submissionRepository.save(savedSubmission);
                log.info("AI Evaluation complete. Final Score: {}", finalScore);
            }
        } catch (Exception e) {
            log.error("Error during AI grading. Score remains 0.", e);
            // Don't fail the request; let the user see "Submitted" even if grading delays
        }

        return savedSubmission.getId();
    }
}