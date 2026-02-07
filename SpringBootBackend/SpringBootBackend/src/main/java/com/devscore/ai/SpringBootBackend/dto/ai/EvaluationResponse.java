package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record EvaluationResponse(
    @JsonProperty("candidate_id") String candidateId,
    @JsonProperty("assessment_id") String assessmentId,
    @JsonProperty("total_score") Double totalScore,
    @JsonProperty("max_total_score") Double maxTotalScore,
    @JsonProperty("percentage") Double percentage,
    @JsonProperty("section_scores") Map<String, Double> sectionScores,
    @JsonProperty("skill_scores") Map<String, Double> skillScores,
    List<String> strengths,
    List<String> weaknesses,
    @JsonProperty("overall_feedback") String overallFeedback,
    @JsonProperty("integrity_score") Double integrityScore,
    @JsonProperty("integrity_flags") List<String> integrityFlags
) {}