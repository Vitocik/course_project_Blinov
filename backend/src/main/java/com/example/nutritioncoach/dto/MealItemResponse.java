package com.example.nutritioncoach.dto;

public record MealItemResponse(
        String mealType,
        String name,
        int calories,
        int protein,
        int carbs,
        int fats,
        String note
) {}
