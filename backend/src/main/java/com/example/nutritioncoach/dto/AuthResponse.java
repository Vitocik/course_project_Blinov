package com.example.nutritioncoach.dto;

import java.util.List;

public record AuthResponse(
        String token,
        UserDto user,
        ProfileResponse profile,
        List<ProgressResponse> progress
) {}
