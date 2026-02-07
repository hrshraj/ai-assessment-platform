package com.devscore.ai.SpringBootBackend.dto;

import java.util.List;

public record AiQuestionDto(
    String questionText,
    String type,
    List<String> options,
    String correctAnswer
) {}
