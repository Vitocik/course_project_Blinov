package com.example.nutritioncoach.workout;

import com.example.nutritioncoach.dto.WorkoutPlanResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workouts")
@Tag(name = "Workouts", description = "Тренировки")
public class WorkoutController {
    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @GetMapping("/plan")
    @Operation(summary = "Получить план тренировок")
    public WorkoutPlanResponse plan(Authentication authentication) {
        return workoutService.generate(authentication.getName());
    }
}
