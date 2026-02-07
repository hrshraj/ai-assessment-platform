package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

// Matches Python's AssessmentResponse
public record AiAssessmentResponse(
    String id,
    @JsonProperty("mcq_count") int mcqCount,
    @JsonProperty("mcq_questions") List<AiQuestion> mcqQuestions,
    @JsonProperty("subjective_questions") List<AiQuestion> subjectiveQuestions,
    @JsonProperty("coding_questions") List<AiQuestion> codingQuestions
) {
    public record AiQuestion(
        String id,
        String question, // or "problem_statement" for coding
        String type, // mapped manually later
        List<Map<String, Object>> options, // for MCQs
        @JsonProperty("correct_answer") String correctAnswer,
        @JsonProperty("test_cases") List<Map<String, Object>> testCases // for coding
    ) {}
}