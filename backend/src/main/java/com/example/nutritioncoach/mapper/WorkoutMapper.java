package com.example.nutritioncoach.mapper;

import com.example.nutritioncoach.dto.WorkoutDayResponse;
import com.example.nutritioncoach.dto.WorkoutExerciseResponse;
import com.example.nutritioncoach.dto.WorkoutPlanResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WorkoutMapper {
    public WorkoutExerciseResponse toExerciseResponse(String name, String sets, String reps) {
        return new WorkoutExerciseResponse(name, sets, reps);
    }

    public WorkoutDayResponse toDayResponse(String day, String focus, List<WorkoutExerciseResponse> exercises) {
        return new WorkoutDayResponse(day, focus, exercises);
    }

    public WorkoutPlanResponse toPlanResponse(List<WorkoutDayResponse> days) {
        return new WorkoutPlanResponse(days);
    }
}
