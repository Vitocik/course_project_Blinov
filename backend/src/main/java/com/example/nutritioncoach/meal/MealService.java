package com.example.nutritioncoach.meal;

import com.example.nutritioncoach.dto.MealResponse;
import com.example.nutritioncoach.dto.MealUpsertRequest;
import com.example.nutritioncoach.user.UserAccountRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class MealService {
    private final MealRepository mealRepository;
    private final UserAccountRepository userAccountRepository;

    public MealService(MealRepository mealRepository, UserAccountRepository userAccountRepository) {
        this.mealRepository = mealRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public List<MealResponse> list(String email) {
        return mealRepository.findByUser_EmailIgnoreCaseOrderByCreatedAtDesc(email)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public MealResponse getById(String email, Long id) {
        return toDto(mealRepository.findByIdAndUser_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Блюдо не найдено.")));
    }

    public List<MealResponse> search(String email, String query) {
        String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return list(email).stream()
                .filter(item -> normalized.isBlank()
                        || contains(item.mealName(), normalized)
                        || contains(item.mealType(), normalized)
                        || contains(item.note(), normalized))
                .toList();
    }

    @Transactional
    public MealResponse create(String email, MealUpsertRequest request) {
        var user = userAccountRepository.findByEmailIgnoreCase(email).orElseThrow();
        Meal meal = new Meal(
                request.mealName().trim(),
                request.calories(),
                request.proteins(),
                request.fats(),
                request.carbs(),
                request.mealType().trim(),
                sanitize(request.note()),
                user
        );
        return toDto(mealRepository.save(meal));
    }

    @Transactional
    public MealResponse update(String email, Long id, MealUpsertRequest request) {
        Meal meal = mealRepository.findByIdAndUser_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Блюдо не найдено."));
        meal.setMealName(request.mealName().trim());
        meal.setMealType(request.mealType().trim());
        meal.setCalories(request.calories());
        meal.setProteins(request.proteins());
        meal.setFats(request.fats());
        meal.setCarbs(request.carbs());
        meal.setNote(sanitize(request.note()));
        return toDto(mealRepository.save(meal));
    }

    @Transactional
    public void delete(String email, Long id) {
        Meal meal = mealRepository.findByIdAndUser_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Блюдо не найдено."));
        mealRepository.delete(meal);
    }

    private MealResponse toDto(Meal meal) {
        return new MealResponse(
                meal.getId(),
                meal.getMealName(),
                meal.getMealType(),
                meal.getCalories(),
                meal.getProteins(),
                meal.getFats(),
                meal.getCarbs(),
                meal.getNote(),
                meal.getCreatedAt(),
                meal.getUpdatedAt()
        );
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private String sanitize(String note) {
        return note == null ? "" : note.trim();
    }
}
