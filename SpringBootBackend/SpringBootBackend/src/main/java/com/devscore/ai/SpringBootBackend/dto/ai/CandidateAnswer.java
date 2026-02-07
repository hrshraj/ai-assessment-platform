package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CandidateAnswer(
    @JsonProperty("question_id") String questionId,
    @JsonProperty("user_answer") String userAnswer
) {}
