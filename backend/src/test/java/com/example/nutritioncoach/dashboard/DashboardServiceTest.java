package com.example.nutritioncoach.dashboard;

import com.example.nutritioncoach.auth.AuthService;
import com.example.nutritioncoach.dto.*;
import com.example.nutritioncoach.meal.NutritionService;
import com.example.nutritioncoach.progress.ProgressEntry;
import com.example.nutritioncoach.progress.ProgressRepository;
import com.example.nutritioncoach.user.UserAccount;
import com.example.nutritioncoach.user.UserAccountRepository;
import com.example.nutritioncoach.user.UserProfile;
import com.example.nutritioncoach.user.UserProfileRepository;
import com.example.nutritioncoach.workout.WorkoutService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import com.example.nutritioncoach.mapper.ProgressMapper;
import com.example.nutritioncoach.mapper.ProfileMapper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {
    @Mock UserAccountRepository userAccountRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock ProgressRepository progressRepository;
    @Mock NutritionService nutritionService;
    @Mock WorkoutService workoutService;
    @Mock AuthService authService;
    @Spy ProgressMapper progressMapper = new ProgressMapper();
    @Spy ProfileMapper profileMapper = new ProfileMapper();

    @InjectMocks DashboardService dashboardService;

    @Test
    void summaryShouldReturnZerosWhenProfileMissing() {
        UserAccount user = user();
        when(userAccountRepository.findByEmailIgnoreCase("user@mail.com")).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser_EmailIgnoreCase("user@mail.com")).thenReturn(Optional.empty());
        when(progressRepository.findByUser_EmailIgnoreCaseOrderByEntryDateDesc("user@mail.com")).thenReturn(List.of());
        when(authService.toUserDto(user)).thenReturn(new UserDto(1L, "user@mail.com", "Пользователь", "USER"));

        var response = dashboardService.summary("user@mail.com");

        assertEquals(0, response.calorieTarget());
        assertEquals(0, response.progressCount());
        assertNull(response.profile());
        assertNull(response.averageWeight());
    }

    @Test
    void summaryShouldCombineProfilePlansAndProgress() {
        UserAccount user = user();
        UserProfile profile = new UserProfile(user);
        profile.setAge(27);
        profile.setSex("female");
        profile.setHeightCm(170);
        profile.setWeightKg(64.0);
        profile.setActivity("moderate");
        profile.setGoal("maintain");
        profile.setTrainingDays(3);
        profile.setUpdatedAt(java.time.LocalDateTime.of(2026, 5, 17, 10, 0));

        ProgressEntry entry1 = new ProgressEntry(user, LocalDate.of(2026, 5, 1), 65.0, "start");
        entry1.setId(1L);
        ProgressEntry entry2 = new ProgressEntry(user, LocalDate.of(2026, 5, 14), 63.8, "progress");
        entry2.setId(2L);

        when(userAccountRepository.findByEmailIgnoreCase("user@mail.com")).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser_EmailIgnoreCase("user@mail.com")).thenReturn(Optional.of(profile));
        when(progressRepository.findByUser_EmailIgnoreCaseOrderByEntryDateDesc("user@mail.com")).thenReturn(List.of(entry2, entry1));
        when(nutritionService.generate("user@mail.com")).thenReturn(new MealPlanResponse(1800, 120, 60, 180, List.of(new MealItemResponse("Завтрак", "Овсянка", 450, 30, 50, 15, "ok"))));
        when(workoutService.generate("user@mail.com")).thenReturn(new WorkoutPlanResponse(List.of(new WorkoutDayResponse("День 1", "Силовая база", List.of(new WorkoutExerciseResponse("Приседания", "3", "12"))))));
        when(authService.toUserDto(user)).thenReturn(new UserDto(1L, "user@mail.com", "Пользователь", "USER"));

        var response = dashboardService.summary("user@mail.com");

        assertEquals(1800, response.calorieTarget());
        assertEquals(1, response.mealsCount());
        assertEquals(1, response.workoutDays());
        assertEquals(2, response.progressCount());
        assertEquals(64.4, response.averageWeight());
        assertEquals(-1.2, response.weightChange(), 0.0001);
        assertNotNull(response.profile());
        assertEquals("Пользователь", response.user().fullName());
    }

    private static UserAccount user() {
        UserAccount user = new UserAccount("user@mail.com", "hashed", "Пользователь");
        user.setId(1L);
        return user;
    }
}
