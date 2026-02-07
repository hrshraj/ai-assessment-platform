package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

// Matches Python's AssessmentCreateRequest
public record AiAssessmentRequest(
    @JsonProperty("jd_id") String jdId,
    @JsonProperty("mcq_count") int mcqCount,
    @JsonProperty("subjective_count") int subjectiveCount,
    @JsonProperty("coding_count") int codingCount
) {}