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

    public List<Question> generateQuestions(Assessment assessment) {
        WebClient client = webClientBuilder.baseUrl(AI_SERVICE_URL).build();

        // FIX: Stateless call. Send the Text directly.
        AssessmentGenerateRequest request = new AssessmentGenerateRequest(
            assessment.getJobDescriptionText(),
            5, 2, 1 // Defaults
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

    // ... (Keep mapResponseToEntities as is, it looked fine) ...
     private List<Question> mapResponseToEntities(AiAssessmentResponse response, Assessment assessment) {
        List<Question> questions = new ArrayList<>();

        // Map MCQs
if (response.subjectiveQuestions() != null) {
        response.subjectiveQuestions().forEach(q -> {
            Question question = new Question();
            question.setQuestionText(q.question());
            question.setType(Question.QuestionType.SUBJECTIVE);
            question.setAssessment(assessment);
            
            // CAPTURE THE DATA
            try {
                // Assuming 'q' has a 'rubric' map and 'expected_answer' list in the response DTO
                // You might need to update AiAssessmentResponse.AiQuestion record to include these fields!
                if (q.rubric() != null) {
                     question.setRubricJson(new ObjectMapper().writeValueAsString(q.rubric()));
                }
                if (q.expectedAnswerPoints() != null) {
                     question.setExpectedAnswerJson(new ObjectMapper().writeValueAsString(q.expectedAnswerPoints()));
                }
            } catch (JsonProcessingException e) {
                // Log error
            }
            questions.add(question);
        });
    }

        // Map Subjective Questions
        if (response.subjectiveQuestions() != null) {
            response.subjectiveQuestions().forEach(q -> {
                Question question = new Question();
                question.setQuestionText(q.question());
                question.setType(Question.QuestionType.SUBJECTIVE);
                question.setAssessment(assessment);
                questions.add(question);
            });
        }

        // Map Coding
        if (response.codingQuestions() != null) {
            response.codingQuestions().forEach(q -> {
                Question question = new Question();
                question.setQuestionText(q.question()); // In Python this might be 'problem_statement'
                question.setType(Question.QuestionType.CODING);
                question.setOptionsJson(q.testCases().toString()); // Store test cases in optionsJson
                question.setAssessment(assessment);
                questions.add(question);
            });
        }

        return questions;
    }
}