package com.example.nutritioncoach.user;

import com.example.nutritioncoach.dto.ProfileResponse;
import com.example.nutritioncoach.dto.ProfileUpsertRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "Profile", description = "Профиль пользователя")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    @Operation(summary = "Получить свой профиль")
    public ProfileResponse getMe(Authentication authentication) {
        return profileService.getProfile(authentication.getName());
    }

    @PutMapping("/me")
    @Operation(summary = "Сохранить свой профиль")
    public ProfileResponse saveMe(Authentication authentication, @Valid @RequestBody ProfileUpsertRequest request) {
        return profileService.saveProfile(authentication.getName(), request);
    }
}
