package com.example.nutritioncoach.dto;

import java.time.LocalDateTime;

public record WorkoutResponse(
        Long id,
        String workoutName,
        String workoutType,
        Integer durationMinutes,
        Integer caloriesBurned,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
