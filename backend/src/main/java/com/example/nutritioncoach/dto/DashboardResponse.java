package com.example.nutritioncoach.dto;

import java.util.List;

public record DashboardResponse(
        UserDto user,
        ProfileResponse profile,
        int calorieTarget,
        int mealsCount,
        int workoutDays,
        int progressCount,
        Double averageWeight,
        Double weightChange,
        List<ProgressResponse> recentProgress
) {}
