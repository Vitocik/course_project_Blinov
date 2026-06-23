package com.example.nutritioncoach.dto;

public record UserDto(
        Long id,
        String email,
        String fullName,
        String role
) {}
