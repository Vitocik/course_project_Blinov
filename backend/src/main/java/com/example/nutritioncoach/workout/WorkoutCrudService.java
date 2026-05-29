package com.example.nutritioncoach.workout;

import com.example.nutritioncoach.dto.WorkoutResponse;
import com.example.nutritioncoach.dto.WorkoutUpsertRequest;
import com.example.nutritioncoach.user.UserAccountRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class WorkoutCrudService {
    private final WorkoutRepository workoutRepository;
    private final UserAccountRepository userAccountRepository;

    public WorkoutCrudService(WorkoutRepository workoutRepository, UserAccountRepository userAccountRepository) {
        this.workoutRepository = workoutRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public List<WorkoutResponse> list(String email) {
        return workoutRepository.findByUser_EmailIgnoreCaseOrderByCreatedAtDesc(email)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public WorkoutResponse getById(String email, Long id) {
        return toDto(workoutRepository.findByIdAndUser_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Тренировка не найдена.")));
    }

    public List<WorkoutResponse> search(String email, String query) {
        String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return list(email).stream()
                .filter(item -> normalized.isBlank()
                        || contains(item.workoutName(), normalized)
                        || contains(item.workoutType(), normalized)
                        || contains(item.description(), normalized))
                .toList();
    }

    @Transactional
    public WorkoutResponse create(String email, WorkoutUpsertRequest request) {
        var user = userAccountRepository.findByEmailIgnoreCase(email).orElseThrow();
        WorkoutPlan workout = new WorkoutPlan(
                request.workoutName().trim(),
                request.workoutType().trim(),
                request.durationMinutes(),
                request.caloriesBurned(),
                request.description().trim(),
                user
        );
        return toDto(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutResponse update(String email, Long id, WorkoutUpsertRequest request) {
        WorkoutPlan workout = workoutRepository.findByIdAndUser_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Тренировка не найдена."));
        workout.setWorkoutName(request.workoutName().trim());
        workout.setWorkoutType(request.workoutType().trim());
        workout.setDurationMinutes(request.durationMinutes());
        workout.setCaloriesBurned(request.caloriesBurned());
        workout.setDescription(request.description().trim());
        return toDto(workoutRepository.save(workout));
    }

    @Transactional
    public void delete(String email, Long id) {
        WorkoutPlan workout = workoutRepository.findByIdAndUser_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Тренировка не найдена."));
        workoutRepository.delete(workout);
    }

    private WorkoutResponse toDto(WorkoutPlan workout) {
        return new WorkoutResponse(
                workout.getId(),
                workout.getWorkoutName(),
                workout.getWorkoutType(),
                workout.getDurationMinutes(),
                workout.getCaloriesBurned(),
                workout.getDescription(),
                workout.getCreatedAt(),
                workout.getUpdatedAt()
        );
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }
}
