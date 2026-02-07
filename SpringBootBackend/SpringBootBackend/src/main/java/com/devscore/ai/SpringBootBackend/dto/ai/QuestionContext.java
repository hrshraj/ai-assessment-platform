package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record QuestionContext(
    String id,
    String type, 
    String text,
    List<String> options,
    @JsonProperty("correct_answer") String correctAnswer,
    @JsonProperty("test_cases") List<Map<String, Object>> testCases,
    
    // --- NEW: Grading Criteria (Critical for Subjective Scoring) ---
    @JsonProperty("rubric") Map<String, Object> rubric,
    @JsonProperty("expected_answer_points") List<String> expectedAnswerPoints
) {}