package com.devscore.ai.SpringBootBackend.service;

import com.devscore.ai.SpringBootBackend.dto.ai.*;
import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.entity.Question;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import lombok.RequiredArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiIntegrationService {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai.service.url}")
    private String AI_SERVICE_URL;

    public List<Question> generateQuestions(Assessment assessment, int totalQuestionCount) {
        WebClient client = webClientBuilder.baseUrl(AI_SERVICE_URL).build();

        // Distribute questions: ~60% MCQ, ~25% subjective, ~15% coding (minimum 1 each)
        int mcqCount = Math.max(1, (int) Math.round(totalQuestionCount * 0.6));
        int subjectiveCount = Math.max(1, (int) Math.round(totalQuestionCount * 0.25));
        int codingCount = Math.max(1, totalQuestionCount - mcqCount - subjectiveCount);

        System.out.println("=== Generating questions: total=" + totalQuestionCount +
            " mcq=" + mcqCount + " subjective=" + subjectiveCount + " coding=" + codingCount);

        AssessmentGenerateRequest request = new AssessmentGenerateRequest(
            assessment.getJobDescriptionText(),
            mcqCount, subjectiveCount, codingCount
        );

        AiAssessmentResponse response = client.post()
                .uri("/api/assessment/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiAssessmentResponse.class)
                .block();

        return mapResponseToEntities(response, assessment);
    }

    // FIX: Takes the full DTO, not just an ID
    public EvaluationResponse evaluateSubmission(EvaluationRequest requestPayload) {
        try {
            return webClientBuilder.baseUrl(AI_SERVICE_URL).build()
                    .post()
                    .uri("/api/candidate/evaluate") // No ID in URL
                    .bodyValue(requestPayload)      // Full Body
                    .retrieve()
                    .bodyToMono(EvaluationResponse.class)
                    .block();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI Service Failed: " + e.getMessage());
        }
    }

    private List<Question> mapResponseToEntities(AiAssessmentResponse response, Assessment assessment) {
        List<Question> questions = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();

        // Map MCQs
        if (response.mcqQuestions() != null) {
            response.mcqQuestions().forEach(q -> {
                Question question = new Question();
                question.setQuestionText(q.getQuestionText());
                question.setType(Question.QuestionType.MCQ);
                question.setAssessment(assessment);
                if (q.options() != null) {
                    try {
                        question.setOptionsJson(objectMapper.writeValueAsString(q.options()));
                    } catch (JsonProcessingException e) {
                        question.setOptionsJson(q.options().toString());
                    }
                }
                if (q.correctAnswer() != null) {
                    question.setCorrectAnswer(q.correctAnswer());
                }
                questions.add(question);
            });
        }

        // Map Subjective Questions
        if (response.subjectiveQuestions() != null) {
            response.subjectiveQuestions().forEach(q -> {
                Question question = new Question();
                question.setQuestionText(q.getQuestionText());
                question.setType(Question.QuestionType.SUBJECTIVE);
                question.setAssessment(assessment);
                try {
                    if (q.rubric() != null) {
                        question.setRubricJson(objectMapper.writeValueAsString(q.rubric()));
                    }
                    if (q.expectedAnswerPoints() != null) {
                        question.setExpectedAnswerJson(objectMapper.writeValueAsString(q.expectedAnswerPoints()));
                    }
                } catch (JsonProcessingException e) {
                    System.err.println("Error serializing rubric/expected answer: " + e.getMessage());
                }
                questions.add(question);
            });
        }

        // Map Coding Questions
        if (response.codingQuestions() != null) {
            System.out.println("=== Mapping " + response.codingQuestions().size() + " coding questions");
            response.codingQuestions().forEach(q -> {
                Question question = new Question();
                question.setQuestionText(q.getQuestionText());
                question.setType(Question.QuestionType.CODING);
                question.setAssessment(assessment);
                // Store test cases as JSON in optionsJson
                if (q.testCases() != null) {
                    try {
                        question.setOptionsJson(objectMapper.writeValueAsString(q.testCases()));
                    } catch (JsonProcessingException e) {
                        question.setOptionsJson(q.testCases().toString());
                    }
                }
                // Store starter code in correctAnswer field (reuse)
                if (q.starterCode() != null) {
                    question.setCorrectAnswer(q.starterCode());
                }
                // Store coding metadata (title, difficulty, constraints, hints, languages) in rubricJson
                try {
                    java.util.Map<String, Object> codingMeta = new java.util.LinkedHashMap<>();
                    if (q.title() != null) codingMeta.put("title", q.title());
                    if (q.difficulty() != null) codingMeta.put("difficulty", q.difficulty());
                    if (q.constraints() != null) codingMeta.put("constraints", q.constraints());
                    if (q.hints() != null) codingMeta.put("hints", q.hints());
                    if (q.languageOptions() != null) codingMeta.put("languageOptions", q.languageOptions());
                    if (q.questionType() != null) codingMeta.put("questionType", q.questionType());
                    question.setRubricJson(objectMapper.writeValueAsString(codingMeta));
                } catch (JsonProcessingException e) {
                    System.out.println("WARN: Failed to serialize coding metadata: " + e.getMessage());
                }
                questions.add(question);
            });
        } else {
            System.out.println("=== WARNING: No coding questions in AI response");
        }

        return questions;
    }
}