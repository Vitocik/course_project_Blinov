package com.example.nutritioncoach.meal;

import com.example.nutritioncoach.dto.MealPlanResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/nutrition")
@Tag(name = "Nutrition", description = "Питание")
public class NutritionController {
    private final NutritionService nutritionService;

    public NutritionController(NutritionService nutritionService) {
        this.nutritionService = nutritionService;
    }

    @GetMapping("/plan")
    @Operation(summary = "Получить план питания")
    public MealPlanResponse plan(Authentication authentication) {
        return nutritionService.generate(authentication.getName());
    }
}
