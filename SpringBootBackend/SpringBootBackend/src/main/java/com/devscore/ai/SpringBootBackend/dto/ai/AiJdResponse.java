package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

// Matches Python's JDResponse
public record AiJdResponse(
    String id,
    String title,
    @JsonProperty("parsed_data") ParsedData parsedData
) {
    public record ParsedData(
        @JsonProperty("experience_level") String experienceLevel,
        List<Skill> skills
    ) {}

    public record Skill(String name, String priority) {}
}