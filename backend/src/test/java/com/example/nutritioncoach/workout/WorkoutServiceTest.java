package com.example.nutritioncoach.workout;

import com.example.nutritioncoach.user.UserAccount;
import com.example.nutritioncoach.user.UserProfile;
import com.example.nutritioncoach.user.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import com.example.nutritioncoach.mapper.WorkoutMapper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkoutServiceTest {
    @Mock UserProfileRepository profileRepository;
    @Spy WorkoutMapper workoutMapper = new WorkoutMapper();
    @InjectMocks WorkoutService workoutService;

    @Test
    void generateShouldBuildLoseWeightPlan() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com")).thenReturn(Optional.of(profile("lose_weight", 2)));
        var plan = workoutService.generate("user@mail.com");
        assertEquals(3, plan.days().size());
        assertEquals("Кардио + всё тело", plan.days().get(0).focus());
    }

    @Test
    void generateShouldBuildMaintainPlan() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com")).thenReturn(Optional.of(profile("maintain", 4)));
        var plan = workoutService.generate("user@mail.com");
        assertEquals(3, plan.days().size());
        assertEquals("Силовая база", plan.days().get(0).focus());
    }

    @Test
    void generateShouldBuildGainMusclePlan() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com")).thenReturn(Optional.of(profile("gain_muscle", 5)));
        var plan = workoutService.generate("user@mail.com");
        assertEquals(3, plan.days().size());
        assertEquals("Грудь + трицепс", plan.days().get(0).focus());
    }

    @Test
    void generateShouldFailWithoutProfile() {
        when(profileRepository.findByUser_EmailIgnoreCase("user@mail.com")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> workoutService.generate("user@mail.com"));
    }

    private static UserProfile profile(String goal, int trainingDays) {
        UserAccount user = new UserAccount("user@mail.com", "hashed", "Пользователь");
        user.setId(1L);
        UserProfile profile = new UserProfile(user);
        profile.setAge(26);
        profile.setSex("female");
        profile.setHeightCm(170);
        profile.setWeightKg(64.0);
        profile.setActivity("moderate");
        profile.setGoal(goal);
        profile.setTrainingDays(trainingDays);
        return profile;
    }
}
