package com.example.nutritioncoach.user;

import com.example.nutritioncoach.dto.ProfileResponse;
import com.example.nutritioncoach.dto.ProfileUpsertRequest;
import com.example.nutritioncoach.mapper.ProfileMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ProfileService {
    private final UserAccountRepository userAccountRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProfileMapper profileMapper;

    public ProfileService(UserAccountRepository userAccountRepository, UserProfileRepository userProfileRepository, ProfileMapper profileMapper) {
        this.userAccountRepository = userAccountRepository;
        this.userProfileRepository = userProfileRepository;
        this.profileMapper = profileMapper;
    }

    public ProfileResponse getProfile(String email) {
        UserProfile profile = userProfileRepository.findByUser_EmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Профиль не найден."));
        return profileMapper.toDto(profile);
    }

    @Transactional
    public ProfileResponse saveProfile(String email, ProfileUpsertRequest request) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден."));
        UserProfile profile = userProfileRepository.findByUser_EmailIgnoreCase(email)
                .orElseGet(() -> new UserProfile(user));

        user.setFullName(request.fullName());
        userAccountRepository.save(user);
        profile.setUser(user);
        profile.setAge(request.age());
        profile.setSex(request.sex());
        profile.setHeightCm(request.heightCm());
        profile.setWeightKg(request.weightKg());
        profile.setActivity(request.activity());
        profile.setGoal(request.goal());
        profile.setTrainingDays(request.trainingDays());
        profile.setAllergies(request.allergies() == null ? "" : request.allergies());
        profile.setNotes(request.notes() == null ? "" : request.notes());
        profile.setUpdatedAt(LocalDateTime.now());

        return toDto(userProfileRepository.save(profile));
    }

    public ProfileResponse toDto(UserProfile profile) {
        return profileMapper.toDto(profile);
    }

}
