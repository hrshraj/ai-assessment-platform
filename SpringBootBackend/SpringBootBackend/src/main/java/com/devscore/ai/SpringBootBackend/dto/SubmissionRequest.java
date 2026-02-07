package com.devscore.ai.SpringBootBackend.dto;

import java.util.List;
import java.util.Map;

public record SubmissionRequest(
    String assessmentId,
    List<AnswerDto> answers,
    
    // --- NEW: Proctoring Data from Frontend ---
    List<Map<String, Object>> browserEvents, // Tab switches, paste logs
    List<Map<String, Object>> responseTimings, // {"q1": 45s, "q2": 120s}
    List<String> webcamSnapshots // Base64 encoded images
) {
    public record AnswerDto(
        String questionId,
        String selectedOption, 
        String codeAnswer      
    ) {}
}