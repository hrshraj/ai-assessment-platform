package com.devscore.ai.SpringBootBackend.dto;

import com.devscore.ai.SpringBootBackend.entity.ProctorLog.LogType;

public record ProctorRequest(
    String submissionId,
    LogType logType,
    String data, 
    Integer sequenceNumber
) {}
