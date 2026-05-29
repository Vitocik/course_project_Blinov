package com.example.nutritioncoach.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ProgressRequest(
        @NotNull LocalDate entryDate,
        @NotNull Double weightKg,
        String note
) {}
