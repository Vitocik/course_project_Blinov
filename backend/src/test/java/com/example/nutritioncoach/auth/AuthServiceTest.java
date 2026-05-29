package com.example.nutritioncoach.auth;

import com.example.nutritioncoach.dto.AuthRequest;
import com.example.nutritioncoach.progress.ProgressEntry;
import com.example.nutritioncoach.progress.ProgressRepository;
import com.example.nutritioncoach.security.JwtService;
import com.example.nutritioncoach.user.UserAccount;
import com.example.nutritioncoach.user.UserAccountRepository;
import com.example.nutritioncoach.user.UserProfile;
import com.example.nutritioncoach.user.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import com.example.nutritioncoach.mapper.UserMapper;
import com.example.nutritioncoach.mapper.ProgressMapper;
import com.example.nutritioncoach.mapper.ProfileMapper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserAccountRepository userAccountRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock ProgressRepository progressRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Spy ProgressMapper progressMapper = new ProgressMapper();
    @Spy ProfileMapper profileMapper = new ProfileMapper();
    @Spy UserMapper userMapper = new UserMapper();

    @InjectMocks AuthService authService;

    @Test
    void registerShouldCreateUserAndReturnAuthResponse() {
        var request = new AuthRequest("Test@Email.com", "secret", "  Иван  ");

        when(userAccountRepository.existsByEmailIgnoreCase("test@email.com")).thenReturn(false);
        when(passwordEncoder.encode("secret")).thenReturn("hashed-password");
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.findByUser_EmailIgnoreCase("test@email.com")).thenAnswer(invocation -> {
            UserAccount user = new UserAccount("test@email.com", "hashed-password", "Иван");
            user.setId(1L);
            UserProfile profile = new UserProfile(user);
            profile.setId(10L);
            return Optional.of(profile);
        });
        when(progressRepository.findByUser_EmailIgnoreCaseOrderByEntryDateDesc("test@email.com")).thenReturn(List.of(progress("test@email.com", 72.4, LocalDate.of(2026, 5, 1), "first")));
        when(jwtService.generateToken("test@email.com", "USER")).thenReturn("jwt-token");

        var response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.token());
        assertEquals("test@email.com", response.user().email());
        assertEquals("Иван", response.user().fullName());
        assertEquals("USER", response.user().role());
        assertNotNull(response.profile());
        assertEquals(1, response.progress().size());
        verify(userAccountRepository).save(any(UserAccount.class));
        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    void loginShouldReturnTokenWhenPasswordMatches() {
        var user = new UserAccount("user@mail.com", "hashed", "Пользователь");
        user.setId(7L);

        when(userAccountRepository.findByEmailIgnoreCase("user@mail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);
        when(userProfileRepository.findByUser_EmailIgnoreCase("user@mail.com")).thenReturn(Optional.empty());
        when(progressRepository.findByUser_EmailIgnoreCaseOrderByEntryDateDesc("user@mail.com")).thenReturn(List.of());
        when(jwtService.generateToken("user@mail.com", "USER")).thenReturn("token-123");

        var response = authService.login(new AuthRequest("user@mail.com", "secret", null));

        assertEquals("token-123", response.token());
        assertEquals("user@mail.com", response.user().email());
        assertTrue(response.progress().isEmpty());
    }

    @Test
    void loginShouldRejectInvalidPassword() {
        var user = new UserAccount("user@mail.com", "hashed", "Пользователь");
        when(userAccountRepository.findByEmailIgnoreCase("user@mail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.login(new AuthRequest("user@mail.com", "wrong", null)));
        verify(jwtService, never()).generateToken(anyString(), anyString());
    }

    private static ProgressEntry progress(String email, double weight, LocalDate date, String note) {
        UserAccount user = new UserAccount(email, "hashed", "Пользователь");
        user.setId(1L);
        ProgressEntry entry = new ProgressEntry(user, date, weight, note);
        entry.setId(99L);
        return entry;
    }
}
