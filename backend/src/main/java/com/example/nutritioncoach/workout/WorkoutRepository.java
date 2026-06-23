package com.example.nutritioncoach.workout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkoutRepository extends JpaRepository<WorkoutPlan, Long> {
    List<WorkoutPlan> findByUser_EmailIgnoreCaseOrderByCreatedAtDesc(String email);
    Optional<WorkoutPlan> findByIdAndUser_EmailIgnoreCase(Long id, String email);
}
