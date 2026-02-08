package com.devscore.ai.SpringBootBackend.dto;

import java.time.LocalDateTime;

public record AssessmentListDto(
    String id,
    String title,
    Integer durationMinutes,
    LocalDateTime createdAt,
    String companyName,
    int questionCount
) {}
