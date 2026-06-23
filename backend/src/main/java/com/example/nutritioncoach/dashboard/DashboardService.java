package com.example.nutritioncoach.dashboard;

import com.example.nutritioncoach.auth.AuthService;
import com.example.nutritioncoach.dto.*;
import com.example.nutritioncoach.mapper.ProfileMapper;
import com.example.nutritioncoach.mapper.ProgressMapper;
import com.example.nutritioncoach.meal.NutritionService;
import com.example.nutritioncoach.progress.ProgressRepository;
import com.example.nutritioncoach.user.UserAccountRepository;
import com.example.nutritioncoach.user.UserProfileRepository;
import com.example.nutritioncoach.workout.WorkoutService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DashboardService {
    private final UserAccountRepository userAccountRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProgressRepository progressRepository;
    private final NutritionService nutritionService;
    private final WorkoutService workoutService;
    private final AuthService authService;
    private final ProfileMapper profileMapper;
    private final ProgressMapper progressMapper;

    public DashboardService(
            UserAccountRepository userAccountRepository,
            UserProfileRepository userProfileRepository,
            ProgressRepository progressRepository,
            NutritionService nutritionService,
            WorkoutService workoutService,
            AuthService authService,
            ProfileMapper profileMapper,
            ProgressMapper progressMapper
    ) {
        this.userAccountRepository = userAccountRepository;
        this.userProfileRepository = userProfileRepository;
        this.progressRepository = progressRepository;
        this.nutritionService = nutritionService;
        this.workoutService = workoutService;
        this.authService = authService;
        this.profileMapper = profileMapper;
        this.progressMapper = progressMapper;
    }

    public DashboardResponse summary(String email) {
        var user = userAccountRepository.findByEmailIgnoreCase(email).orElseThrow();
        var profile = userProfileRepository.findByUser_EmailIgnoreCase(email)
                .map(profileMapper::toDto)
                .orElse(null);
        var progress = progressRepository.findByUser_EmailIgnoreCaseOrderByEntryDateDesc(email)
                .stream()
                .map(progressMapper::toDto)
                .toList();
        var plan = profile != null ? nutritionService.generate(email) : new MealPlanResponse(0, 0, 0, 0, List.of());
        var workout = profile != null ? workoutService.generate(email) : new WorkoutPlanResponse(List.of());

        Double avgWeight = progress.isEmpty() ? null : progress.stream().mapToDouble(ProgressResponse::weightKg).average().orElse(0);
        Double change = null;
        if (progress.size() >= 2) {
            var sorted = progress.stream().sorted((a, b) -> a.entryDate().compareTo(b.entryDate())).toList();
            change = sorted.get(sorted.size() - 1).weightKg() - sorted.get(0).weightKg();
        }

        return new DashboardResponse(
                authService.toUserDto(user),
                profile,
                plan.calories(),
                plan.items().size(),
                workout.days().size(),
                progress.size(),
                avgWeight,
                change,
                progress.stream().limit(5).toList()
        );
    }
}
