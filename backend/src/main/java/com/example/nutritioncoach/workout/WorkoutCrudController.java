package com.example.nutritioncoach.workout;

import com.example.nutritioncoach.dto.WorkoutResponse;
import com.example.nutritioncoach.dto.WorkoutUpsertRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workout-plans")
@Tag(name = "Workout CRUD", description = "CRUD для пользовательских тренировок")
public class WorkoutCrudController {
    private final WorkoutCrudService workoutCrudService;

    public WorkoutCrudController(WorkoutCrudService workoutCrudService) {
        this.workoutCrudService = workoutCrudService;
    }

    @GetMapping
    @Operation(summary = "Список тренировок")
    public List<WorkoutResponse> list(Authentication authentication) {
        return workoutCrudService.list(authentication.getName());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Тренировка по ID")
    public WorkoutResponse getById(Authentication authentication, @PathVariable Long id) {
        return workoutCrudService.getById(authentication.getName(), id);
    }

    @GetMapping("/search")
    @Operation(summary = "Поиск тренировок")
    public List<WorkoutResponse> search(Authentication authentication, @RequestParam(required = false) String query) {
        return workoutCrudService.search(authentication.getName(), query);
    }

    @PostMapping
    @Operation(summary = "Создать тренировку")
    public WorkoutResponse create(Authentication authentication, @Valid @RequestBody WorkoutUpsertRequest request) {
        return workoutCrudService.create(authentication.getName(), request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить тренировку")
    public WorkoutResponse update(Authentication authentication, @PathVariable Long id, @Valid @RequestBody WorkoutUpsertRequest request) {
        return workoutCrudService.update(authentication.getName(), id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить тренировку")
    public void delete(Authentication authentication, @PathVariable Long id) {
        workoutCrudService.delete(authentication.getName(), id);
    }
}
