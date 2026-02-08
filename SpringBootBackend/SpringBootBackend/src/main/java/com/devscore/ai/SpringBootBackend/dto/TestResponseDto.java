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
        String starterCode
    ) {}
}
