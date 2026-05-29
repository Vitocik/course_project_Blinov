package com.example.nutritioncoach.dto;

import java.time.LocalDateTime;

public record MealResponse(
        Long id,
        String mealName,
        String mealType,
        Integer calories,
        Integer proteins,
        Integer fats,
        Integer carbs,
        String note,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
