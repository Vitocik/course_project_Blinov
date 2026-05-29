package com.example.nutritioncoach.auth;

import com.example.nutritioncoach.dto.*;
import com.example.nutritioncoach.mapper.ProfileMapper;
import com.example.nutritioncoach.mapper.ProgressMapper;
import com.example.nutritioncoach.mapper.UserMapper;
import com.example.nutritioncoach.progress.ProgressRepository;
import com.example.nutritioncoach.security.JwtService;
import com.example.nutritioncoach.user.RoleNames;
import com.example.nutritioncoach.user.UserAccount;
import com.example.nutritioncoach.user.UserAccountRepository;
import com.example.nutritioncoach.user.UserProfile;
import com.example.nutritioncoach.user.UserProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {
    private final UserAccountRepository userAccountRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProgressRepository progressRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final ProfileMapper profileMapper;
    private final ProgressMapper progressMapper;

    public AuthService(
            UserAccountRepository userAccountRepository,
            UserProfileRepository userProfileRepository,
            ProgressRepository progressRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserMapper userMapper,
            ProfileMapper profileMapper,
            ProgressMapper progressMapper
    ) {
        this.userAccountRepository = userAccountRepository;
        this.userProfileRepository = userProfileRepository;
        this.progressRepository = progressRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
        this.profileMapper = profileMapper;
        this.progressMapper = progressMapper;
    }

    @Transactional
    public AuthResponse register(AuthRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Пользователь с таким email уже существует.");
        }

        UserAccount user = new UserAccount(email, passwordEncoder.encode(request.password()), normalizeName(request.fullName(), email), RoleNames.USER);
        user = userAccountRepository.save(user);

        UserProfile profile = new UserProfile(user);
        userProfileRepository.save(profile);

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        String email = request.email().trim().toLowerCase();
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Неверный email или пароль."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Неверный email или пароль.");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(UserAccount user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        ProfileResponse profile = userProfileRepository.findByUser_EmailIgnoreCase(user.getEmail())
                .map(profileMapper::toDto)
                .orElse(null);
        List<ProgressResponse> progress = progressRepository.findByUser_EmailIgnoreCaseOrderByEntryDateDesc(user.getEmail())
                .stream()
                .map(progressMapper::toDto)
                .toList();
        return new AuthResponse(token, userMapper.toDto(user), profile, progress);
    }

    private String normalizeName(String fullName, String email) {
        String trimmed = fullName == null ? "" : fullName.trim();
        return trimmed.isEmpty() ? email.split("@")[0] : trimmed;
    }

    public UserDto toUserDto(UserAccount user) {
        return userMapper.toDto(user);
    }
}
