package com.example.nutritioncoach.meal;

import com.example.nutritioncoach.mapper.MealMapper;
import com.example.nutritioncoach.user.UserAccount;
import com.example.nutritioncoach.user.UserProfile;
import com.example.nutritioncoach.user.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionServiceTest {

    @Mock
    UserProfileRepository profileRepository;

    @Spy
    MealMapper mealMapper = new MealMapper();

    @InjectMocks
    NutritionService nutritionService;

    @Test
    void generateShouldBuildLoseWeightPlan() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com"))
                .thenReturn(Optional.of(profile("lose_weight")));

        var plan = nutritionService.generate("user@mail.com");

        assertTrue(plan.calories() > 0);
        assertEquals(5, plan.items().size());
        assertEquals("Завтрак", plan.items().get(0).mealType());
    }

    @Test
    void generateShouldBuildMaintainPlan() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com"))
                .thenReturn(Optional.of(profile("maintain")));

        var plan = nutritionService.generate("user@mail.com");

        assertEquals(5, plan.items().size());
        assertTrue(plan.calories() >= 1400);
        assertTrue(plan.protein() > 0);
    }

    @Test
    void generateShouldBuildGainMusclePlan() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com"))
                .thenReturn(Optional.of(profile("gain_muscle")));

        var plan = nutritionService.generate("user@mail.com");

        assertEquals(5, plan.items().size());
        assertTrue(plan.protein() >= 80);
        assertTrue(plan.fats() > 0);
    }

    @Test
    void generateShouldHandleMaleHighActivity() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com"))
                .thenReturn(Optional.of(
                        profile(
                                "gain_muscle",
                                "male",
                                "high"
                        )
                ));

        var plan = nutritionService.generate("user@mail.com");

        assertNotNull(plan);
        assertTrue(plan.calories() > 0);
        assertTrue(plan.protein() > 0);
    }

    @Test
    void generateShouldHandleLowActivity() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com"))
                .thenReturn(Optional.of(
                        profile(
                                "maintain",
                                "female",
                                "low"
                        )
                ));

        var plan = nutritionService.generate("user@mail.com");

        assertNotNull(plan);
        assertTrue(plan.calories() >= 1400);
    }

    @Test
    void generateShouldFailWithoutProfile() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com"))
                .thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> nutritionService.generate("user@mail.com")
        );
    }

    private static UserProfile profile(String goal) {
        return profile(
                goal,
                "female",
                "moderate"
        );
    }

    private static UserProfile profile(
            String goal,
            String sex,
            String activity
    ) {
        UserAccount user =
                new UserAccount(
                        "user@mail.com",
                        "hashed",
                        "Пользователь"
                );

        user.setId(1L);

        UserProfile profile = new UserProfile(user);
        profile.setAge(26);
        profile.setSex(sex);
        profile.setHeightCm(170);
        profile.setWeightKg(64.0);
        profile.setActivity(activity);
        profile.setGoal(goal);
        profile.setTrainingDays(4);

        return profile;
    }
}