package com.example.nutritioncoach.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WorkoutUpsertRequest(
        @NotBlank String workoutName,
        @NotBlank String workoutType,
        @NotNull @Min(1) Integer durationMinutes,
        @NotNull @Min(0) Integer caloriesBurned,
        @NotBlank String description
) {}
