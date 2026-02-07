package com.devscore.ai.SpringBootBackend.dto;

import java.util.List;

public record SubmissionRequest(
    String assessmentId,
    List<AnswerDto> answers
) {
    public record AnswerDto(
        String questionId,
        String selectedOption, 
        String codeAnswer      
    ) {}
}
