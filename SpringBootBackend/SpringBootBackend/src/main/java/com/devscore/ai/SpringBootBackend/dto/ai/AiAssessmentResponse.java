package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record AiAssessmentResponse(
    String id,
    @JsonProperty("mcq_count") int mcqCount,
    @JsonProperty("mcq_questions") List<AiQuestion> mcqQuestions,
    @JsonProperty("subjective_questions") List<AiQuestion> subjectiveQuestions,
    @JsonProperty("coding_questions") List<AiQuestion> codingQuestions
) {
    public record AiQuestion(
        String id,
        String question, 
        String type, 
        List<Map<String, Object>> options, 
        @JsonProperty("correct_answer") String correctAnswer,
        @JsonProperty("test_cases") List<Map<String, Object>> testCases,
        
        // --- NEW: Capture Rubric from Generator ---
        Map<String, Object> rubric,
        @JsonProperty("expected_answer_points") List<String> expectedAnswerPoints
    ) {}
}