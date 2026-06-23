package com.example.nutritioncoach.meal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MealRepository extends JpaRepository<Meal, Long> {
    List<Meal> findByUser_EmailIgnoreCaseOrderByCreatedAtDesc(String email);
    Optional<Meal> findByIdAndUser_EmailIgnoreCase(Long id, String email);
}
