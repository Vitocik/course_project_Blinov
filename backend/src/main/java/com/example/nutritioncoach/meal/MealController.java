package com.example.nutritioncoach.meal;

import com.example.nutritioncoach.dto.MealResponse;
import com.example.nutritioncoach.dto.MealUpsertRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meals")
@Tag(name = "Meals", description = "CRUD для блюд пользователя")
public class MealController {
    private final MealService mealService;

    public MealController(MealService mealService) {
        this.mealService = mealService;
    }

    @GetMapping
    @Operation(summary = "Список блюд")
    public List<MealResponse> list(Authentication authentication) {
        return mealService.list(authentication.getName());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Блюдо по ID")
    public MealResponse getById(Authentication authentication, @PathVariable Long id) {
        return mealService.getById(authentication.getName(), id);
    }

    @GetMapping("/search")
    @Operation(summary = "Поиск блюд")
    public List<MealResponse> search(Authentication authentication, @RequestParam(required = false) String query) {
        return mealService.search(authentication.getName(), query);
    }

    @PostMapping
    @Operation(summary = "Создать блюдо")
    public MealResponse create(Authentication authentication, @Valid @RequestBody MealUpsertRequest request) {
        return mealService.create(authentication.getName(), request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить блюдо")
    public MealResponse update(Authentication authentication, @PathVariable Long id, @Valid @RequestBody MealUpsertRequest request) {
        return mealService.update(authentication.getName(), id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить блюдо")
    public void delete(Authentication authentication, @PathVariable Long id) {
        mealService.delete(authentication.getName(), id);
    }
}
