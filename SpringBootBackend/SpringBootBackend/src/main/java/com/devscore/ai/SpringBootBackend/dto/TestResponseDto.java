package com.devscore.ai.SpringBootBackend.dto;

import java.util.List;

public record TestResponseDto(
    String assessmentId,
    String title,
    Integer durationMinutes,
    List<QuestionDto> questions
) {
    public record QuestionDto(
        String id,
        String text,
        String type,
        List<String> options,
        String starterCode,
        // Coding question metadata (LeetCode-style)
        String codingTitle,
        String difficulty,
        List<String> constraints,
        List<String> hints,
        List<String> languageOptions,
        // Test cases as structured objects for coding
        List<java.util.Map<String, Object>> testCases
    ) {}
}
