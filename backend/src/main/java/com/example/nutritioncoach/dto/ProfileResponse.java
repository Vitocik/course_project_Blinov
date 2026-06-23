package com.example.nutritioncoach.dto;

import java.time.LocalDateTime;

public record ProfileResponse(
        Long id,
        String fullName,
        Integer age,
        String sex,
        Integer heightCm,
        Double weightKg,
        String activity,
        String goal,
        Integer trainingDays,
        String allergies,
        String notes,
        LocalDateTime updatedAt
) {}
