package com.example.nutritioncoach.dto;

import jakarta.validation.constraints.*;

public record ProfileUpsertRequest(
        @NotBlank String fullName,
        @NotNull @Min(10) @Max(100) Integer age,
        @NotBlank String sex,
        @NotNull @Min(120) @Max(230) Integer heightCm,
        @NotNull @DecimalMin("30.0") @DecimalMax("300.0") Double weightKg,
        @NotBlank String activity,
        @NotBlank String goal,
        @NotNull @Min(1) @Max(7) Integer trainingDays,
        String allergies,
        String notes
) {}
