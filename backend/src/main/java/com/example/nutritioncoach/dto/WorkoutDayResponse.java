package com.example.nutritioncoach.dto;

import java.util.List;

public record WorkoutDayResponse(
        String day,
        String focus,
        List<WorkoutExerciseResponse> exercises
) {}
