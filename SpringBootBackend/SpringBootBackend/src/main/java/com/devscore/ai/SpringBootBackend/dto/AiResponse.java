package com.devscore.ai.SpringBootBackend.dto;

import java.util.List;

public record AiResponse(List<AiQuestionDto>questions) {}
