package com.example.nutritioncoach.dto;

import java.util.List;

public record MealPlanResponse(
        int calories,
        int protein,
        int fats,
        int carbs,
        List<MealItemResponse> items
) {}
