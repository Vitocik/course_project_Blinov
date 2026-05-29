package com.example.nutritioncoach.dto;

import java.time.LocalDate;

public record ProgressResponse(
        Long id,
        LocalDate entryDate,
        Double weightKg,
        String note
) {}
