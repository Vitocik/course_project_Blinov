package com.example.nutritioncoach.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MealUpsertRequest(
        @NotBlank String mealName,
        @NotBlank String mealType,
        @NotNull @Min(0) Integer calories,
        @NotNull @Min(0) Integer proteins,
        @NotNull @Min(0) Integer fats,
        @NotNull @Min(0) Integer carbs,
        String note
) {}
