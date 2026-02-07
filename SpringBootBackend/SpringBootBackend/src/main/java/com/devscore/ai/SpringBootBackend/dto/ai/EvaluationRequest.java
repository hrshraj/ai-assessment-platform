package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record EvaluationRequest(
    @JsonProperty("candidate_id") String candidateId,
    @JsonProperty("assessment_id") String assessmentId,
    @JsonProperty("questions") List<QuestionContext> questions,
    @JsonProperty("answers") List<CandidateAnswer> answers,
    @JsonProperty("resume_text") String resumeText,
    
    // --- NEW: Proctoring Data ---
    @JsonProperty("response_timings") List<Map<String, Object>> responseTimings,
    @JsonProperty("browser_events") List<Map<String, Object>> browserEvents
) {}