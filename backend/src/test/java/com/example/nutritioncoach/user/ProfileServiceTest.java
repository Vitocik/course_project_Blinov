package com.example.nutritioncoach.user;

import com.example.nutritioncoach.dto.ProfileUpsertRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import com.example.nutritioncoach.mapper.ProfileMapper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {
    @Mock UserAccountRepository userAccountRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Spy ProfileMapper profileMapper = new ProfileMapper();

    @InjectMocks ProfileService profileService;

    @Test
    void getProfileShouldMapEntityToDto() {
        UserAccount user = new UserAccount("person@mail.com", "hashed", "Андрей");
        user.setId(1L);
        UserProfile profile = profile(user);
        profile.setId(5L);
        profile.setUpdatedAt(LocalDateTime.of(2026, 5, 17, 10, 0));

        when(userProfileRepository.findByUser_EmailIgnoreCase("person@mail.com")).thenReturn(Optional.of(profile));

        var response = profileService.getProfile("person@mail.com");

        assertEquals("Андрей", response.fullName());
        assertEquals(28, response.age());
        assertEquals(179, response.heightCm());
        assertEquals(5L, response.id());
    }

    @Test
    void saveProfileShouldCreateAndPersistUserAndProfile() {
        UserAccount user = new UserAccount("person@mail.com", "hashed", "Старое имя");
        user.setId(1L);
        when(userAccountRepository.findByEmailIgnoreCase("person@mail.com")).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser_EmailIgnoreCase("person@mail.com")).thenReturn(Optional.empty());
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> {
            UserProfile profile = invocation.getArgument(0);
            profile.setId(11L);
            return profile;
        });

        ProfileUpsertRequest request = new ProfileUpsertRequest("Новое имя", 31, "male", 185, 82.5, "high", "gain_muscle", 5, "", "Тестовый профиль");

        var response = profileService.saveProfile("person@mail.com", request);

        ArgumentCaptor<UserAccount> userCaptor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userAccountRepository).save(userCaptor.capture());
        assertEquals("Новое имя", userCaptor.getValue().getFullName());
        assertEquals("Новое имя", response.fullName());
        assertEquals(31, response.age());
        assertEquals(11L, response.id());
        assertEquals("gain_muscle", response.goal());
    }

    @Test
    void saveProfileShouldUpdateExistingProfile() {
        UserAccount user = new UserAccount("person@mail.com", "hashed", "Старое имя");
        user.setId(1L);
        UserProfile profile = profile(user);
        profile.setId(12L);

        when(userAccountRepository.findByEmailIgnoreCase("person@mail.com")).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser_EmailIgnoreCase("person@mail.com")).thenReturn(Optional.of(profile));
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileUpsertRequest request = new ProfileUpsertRequest("Старое имя", 35, "female", 170, 64.0, "moderate", "maintain", 3, "", "Обновление");

        var response = profileService.saveProfile("person@mail.com", request);

        assertEquals(35, response.age());
        assertEquals(64.0, response.weightKg());
        verify(userProfileRepository).save(any(UserProfile.class));
    }

    private static UserProfile profile(UserAccount user) {
        UserProfile profile = new UserProfile(user);
        profile.setAge(28);
        profile.setSex("female");
        profile.setHeightCm(179);
        profile.setWeightKg(68.2);
        profile.setActivity("moderate");
        profile.setGoal("maintain");
        profile.setTrainingDays(4);
        profile.setAllergies("none");
        profile.setNotes("notes");
        profile.setUpdatedAt(LocalDateTime.of(2026, 5, 17, 10, 0));
        return profile;
    }
}
