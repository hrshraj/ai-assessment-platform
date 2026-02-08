package com.devscore.ai.SpringBootBackend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devscore.ai.SpringBootBackend.dto.SubmissionRequest;
import com.devscore.ai.SpringBootBackend.dto.TestResponseDto;
import com.devscore.ai.SpringBootBackend.dto.ai.CandidateAnswer;
import com.devscore.ai.SpringBootBackend.dto.ai.EvaluationRequest;
import com.devscore.ai.SpringBootBackend.dto.ai.EvaluationResponse;
import com.devscore.ai.SpringBootBackend.dto.ai.QuestionContext;
import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.entity.Question;
import com.devscore.ai.SpringBootBackend.entity.Submission;
import com.devscore.ai.SpringBootBackend.entity.SubmissionAnswer;
import com.devscore.ai.SpringBootBackend.entity.User;
import com.devscore.ai.SpringBootBackend.repository.AssessmentRepository;
import com.devscore.ai.SpringBootBackend.repository.QuestionRepository;
import com.devscore.ai.SpringBootBackend.repository.SubmissionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateTestService {

    private final AiIntegrationService aiIntegrationService;
    private final AssessmentRepository assessmentRepository;
    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;

    /**
     * Start Test: Fetches questions and prepares them for the Frontend.
     */
    public TestResponseDto startTest(String assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        List<TestResponseDto.QuestionDto> questionDtos = assessment.getQuestions().stream()
                .map(q -> {
                    List<String> options = parseOptions(q.getOptionsJson());
                    return new TestResponseDto.QuestionDto(
                            String.valueOf(q.getId()),
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
     * Submit Test: Complete workflow (Save -> Plagiarism -> AI Eval -> Update)
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
                .score(0)
                .build();

        // 2. Save Raw Proctoring Data (For Replay Feature)
        try {
            if (request.browserEvents() != null) {
                submission.setBrowserEventsJson(objectMapper.writeValueAsString(request.browserEvents()));
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to save browser events", e);
        }

        // 3. Process Answers & Build Python Request
        List<SubmissionAnswer> answerEntities = new ArrayList<>();
        List<CandidateAnswer> pythonAnswers = new ArrayList<>();
        List<QuestionContext> pythonQuestions = new ArrayList<>();

        for (SubmissionRequest.AnswerDto answerDto : request.answers()) {
            Question question = questionRepository.findById(answerDto.questionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            // A. Entity
            SubmissionAnswer subAnswer = new SubmissionAnswer();
            subAnswer.setSubmission(submission);
            subAnswer.setQuestion(question);
            
            String userResponse = (question.getType() == Question.QuestionType.MCQ) 
                 ? answerDto.selectedOption() : answerDto.codeAnswer();
            if(userResponse == null) userResponse = "";
            
            subAnswer.setUserAnswer(userResponse);
            subAnswer.setCorrect(false);
            answerEntities.add(subAnswer);

            // B. Python DTO
            pythonAnswers.add(new CandidateAnswer(String.valueOf(question.getId()), userResponse));

            // C. Python Context (Must include Rubric for Subjective Grading!)
            Map<String, Object> rubric = null;
            List<String> expectedAnswer = null;

            if (question.getType() == Question.QuestionType.SUBJECTIVE) {
                 try {
                     if (question.getRubricJson() != null) {
                         rubric = objectMapper.readValue(question.getRubricJson(), new TypeReference<Map<String, Object>>(){});
                     }
                     if (question.getExpectedAnswerJson() != null) {
                         expectedAnswer = objectMapper.readValue(question.getExpectedAnswerJson(), new TypeReference<List<String>>(){});
                     }
                 } catch (Exception e) {
                     log.error("Failed to parse rubric/expected answer", e);
                 }
            }

            pythonQuestions.add(new QuestionContext(
                String.valueOf(question.getId()),
                question.getType().name(),
                question.getQuestionText(),
                parseOptions(question.getOptionsJson()),
                question.getCorrectAnswer(),
                parseTestCases(question.getOptionsJson()),
                rubric,          // Sent to AI
                expectedAnswer   // Sent to AI
            ));
        }

        submission.setAnswers(answerEntities);
        
        // --- 4. Plagiarism Check (Fingerprinting) ---
        String allCode = request.answers().stream()
            .map(SubmissionRequest.AnswerDto::codeAnswer)
            .filter(s -> s != null && !s.isBlank())
            .collect(Collectors.joining("\n"));

        if (!allCode.isBlank()) {
            try {
                // Step A: Get Fingerprint (You need to implement generateFingerprint in AiIntegrationService)
                // List<Long> currentFingerprint = aiIntegrationService.generateFingerprint(allCode); 
                // submission.setCodeFingerprint(currentFingerprint); 
                
                // Step B: Compare (Commented out until you implement repository method)
                /* List<Submission> others = submissionRepository.findByAssessmentIdAndIdNot(request.assessmentId(), submission.getId());
                double maxSimilarity = 0.0;
                for (Submission other : others) {
                     double sim = calculateSimilarity(currentFingerprint, other.getCodeFingerprint());
                     if (sim > maxSimilarity) maxSimilarity = sim;
                }
                if (maxSimilarity > 0.85) {
                     // Add flag logic here
                     submission.setIntegrityScore(50.0); 
                }
                */
            } catch (Exception e) {
                log.error("Plagiarism check skipped", e);
            }
        }

        Submission savedSubmission = submissionRepository.save(submission);

        // --- 5. Trigger AI Evaluation ---
        try {
            EvaluationRequest evalRequest = new EvaluationRequest(
                String.valueOf(candidate.getId()),
                request.assessmentId(),
                pythonQuestions,
                pythonAnswers,
                null, // Resume Text
                request.responseTimings(),
                request.browserEvents()
            );

            EvaluationResponse aiResult = aiIntegrationService.evaluateSubmission(evalRequest);

            if (aiResult != null) {
                // Save RICH DATA for Recruiter Dashboard
                if(aiResult.totalScore() != null) savedSubmission.setScore(aiResult.totalScore().intValue());
                savedSubmission.setAiFeedback(aiResult.overallFeedback());
                savedSubmission.setIntegrityScore(aiResult.integrityScore());
                
                // Serialize Lists/Maps to JSON for storage
                if(aiResult.skillScores() != null) savedSubmission.setSkillScoresJson(objectMapper.writeValueAsString(aiResult.skillScores()));
                if(aiResult.strengths() != null) savedSubmission.setStrengthsJson(objectMapper.writeValueAsString(aiResult.strengths()));
                if(aiResult.weaknesses() != null) savedSubmission.setWeaknessesJson(objectMapper.writeValueAsString(aiResult.weaknesses()));
                if(aiResult.integrityFlags() != null) savedSubmission.setIntegrityFlagsJson(objectMapper.writeValueAsString(aiResult.integrityFlags()));
                
                submissionRepository.save(savedSubmission);
            }
        } catch (Exception e) {
            log.error("Error during AI grading", e);
        }

        return savedSubmission.getId();
    }

    // --- Helper Methods ---

    private List<String> parseOptions(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            // First try parsing as List<String> (simple format)
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            try {
                // AI returns objects: [{"label": "A", "text": "...", "is_correct": false}]
                List<Map<String, Object>> optionObjects = objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
                return optionObjects.stream()
                    .map(opt -> {
                        String label = opt.get("label") != null ? opt.get("label").toString() : "";
                        String text = opt.get("text") != null ? opt.get("text").toString() : "";
                        return label.isEmpty() ? text : label + ". " + text;
                    })
                    .collect(Collectors.toList());
            } catch (Exception e2) {
                log.error("Failed to parse options JSON: {}", json, e2);
                return new ArrayList<>();
            }
        }
    }

    private List<Map<String, Object>> parseTestCases(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return null;
        }
    }
    
    // Plagiarism Logic Helper
    private double calculateSimilarity(List<Long> sig1, List<Long> sig2) {
        if (sig1 == null || sig2 == null || sig1.isEmpty() || sig2.isEmpty()) return 0.0;
        Set<Long> set1 = new HashSet<>(sig1);
        Set<Long> set2 = new HashSet<>(sig2);
        
        Set<Long> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);
        
        Set<Long> union = new HashSet<>(set1);
        union.addAll(set2);
        
        if (union.isEmpty()) return 0.0;
        return (double) intersection.size() / union.size();
    }
}