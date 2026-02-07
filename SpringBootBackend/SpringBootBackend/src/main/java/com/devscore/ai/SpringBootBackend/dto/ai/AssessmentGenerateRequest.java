package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AssessmentGenerateRequest(
    @JsonProperty("jd_text") String jdText, // Send Text, not ID
    @JsonProperty("mcq_count") int mcqCount,
    @JsonProperty("subjective_count") int subjectiveCount,
    @JsonProperty("coding_count") int codingCount
) {}
