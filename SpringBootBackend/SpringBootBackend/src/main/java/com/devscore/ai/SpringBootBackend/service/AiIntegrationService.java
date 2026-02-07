package com.devscore.ai.SpringBootBackend.service;

import com.devscore.ai.SpringBootBackend.dto.ai.*;
import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.entity.Question;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import lombok.RequiredArgsConstructor;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiIntegrationService {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai.service.url}") // e.g., http://localhost:8000
    private String AI_SERVICE_URL;

    public List<Question> generateQuestions(Assessment assessment) {
        WebClient client = webClientBuilder.baseUrl(AI_SERVICE_URL).build();

        // STEP 1: Upload JD to AI to get an ID (Python needs this context)
        // We construct the body as a raw Map to match Python's JDCreateRequest
        Map<String, String> jdPayload = Map.of(
            "title", assessment.getTitle(),
            "raw_text", assessment.getJobDescriptionText()
        );

        AiJdResponse jdResponse = client.post()
                .uri("/api/jd/create")
                .bodyValue(jdPayload)
                .retrieve()
                .bodyToMono(AiJdResponse.class)
                .block();

        if (jdResponse == null) throw new RuntimeException("AI JD Parsing failed");

        // STEP 2: Request Assessment Generation
        AiAssessmentRequest genRequest = new AiAssessmentRequest(
            jdResponse.id(), 5, 2, 1 // Hackathon defaults: 5 MCQs, 2 Subjective, 1 Coding
        );

        AiAssessmentResponse aiResponse = client.post()
                .uri("/api/assessment/generate")
                .bodyValue(genRequest)
                .retrieve()
                .bodyToMono(AiAssessmentResponse.class)
                .block();

        return mapResponseToEntities(aiResponse, assessment);
    }

    private List<Question> mapResponseToEntities(AiAssessmentResponse response, Assessment assessment) {
        List<Question> questions = new ArrayList<>();

        // Map MCQs
        if (response.mcqQuestions() != null) {
            response.mcqQuestions().forEach(q -> {
                Question question = new Question();
                question.setQuestionText(q.question());
                question.setType(Question.QuestionType.MCQ);
                question.setCorrectAnswer(q.correctAnswer());
                // Convert options list to simple string for storage
                question.setOptionsJson(q.options().toString()); 
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

    public EvaluationResponse evaluateSubmission(String submissionId) {
        
        String url = AI_SERVICE_URL + "/api/candidate/evaluate/" + submissionId;

        try {
            return webClientBuilder.build()
                    .post()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(EvaluationResponse.class)
                    .block(); // Blocking is acceptable for MVP/Hackathon simplicity
        } catch (Exception e) {
            throw new RuntimeException("AI Evaluation Service Unreachable");
        }
    }
}