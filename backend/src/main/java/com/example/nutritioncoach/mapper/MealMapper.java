package com.example.nutritioncoach.mapper;

import com.example.nutritioncoach.dto.MealItemResponse;
import com.example.nutritioncoach.dto.MealPlanResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MealMapper {
    public MealItemResponse toItemResponse(String mealType, String name, int calories, int protein, int carbs, int fats, String note) {
        return new MealItemResponse(mealType, name, calories, protein, carbs, fats, note);
    }

    public MealPlanResponse toPlanResponse(int calories, int protein, int fats, int carbs, List<MealItemResponse> items) {
        return new MealPlanResponse(calories, protein, fats, carbs, items);
    }
}
