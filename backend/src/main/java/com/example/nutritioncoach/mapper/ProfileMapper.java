package com.example.nutritioncoach.mapper;

import com.example.nutritioncoach.dto.ProfileResponse;
import com.example.nutritioncoach.user.UserProfile;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {
    public ProfileResponse toDto(UserProfile profile) {
        if (profile == null) {
            return null;
        }
        return new ProfileResponse(
                profile.getId(),
                profile.getUser().getFullName(),
                profile.getAge(),
                profile.getSex(),
                profile.getHeightCm(),
                profile.getWeightKg(),
                profile.getActivity(),
                profile.getGoal(),
                profile.getTrainingDays(),
                profile.getAllergies(),
                profile.getNotes(),
                profile.getUpdatedAt()
        );
    }
}
