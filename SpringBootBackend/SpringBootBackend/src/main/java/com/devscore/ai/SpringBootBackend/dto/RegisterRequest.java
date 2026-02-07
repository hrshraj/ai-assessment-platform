package com.devscore.ai.SpringBootBackend.dto;

import com.devscore.ai.SpringBootBackend.entity.Role;

public record RegisterRequest(
    String fullName,
    String email,
    String password,
    Role role,
    String companyName,   
    String githubProfile  
) {}
