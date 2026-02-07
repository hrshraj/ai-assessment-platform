package com.devscore.ai.SpringBootBackend.dto;

import java.time.LocalDateTime;

public record LeaderboardEntry(
    Long candidateId,
    String candidateName,
    String email,
    Integer score,
    String status, 
    LocalDateTime submittedAt
) {}