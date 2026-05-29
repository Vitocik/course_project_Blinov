package com.example.nutritioncoach.admin;

import com.example.nutritioncoach.dto.UserDto;
import com.example.nutritioncoach.user.RoleNames;
import com.example.nutritioncoach.user.UserAccountRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Административные методы")
public class AdminController {
    private final UserAccountRepository userAccountRepository;

    public AdminController(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить список пользователей", description = "Доступно только администратору")
    public List<UserDto> users() {
        return userAccountRepository.findAll().stream()
                .map(user -> new UserDto(user.getId(), user.getEmail(), user.getFullName(),
                        user.getRole() == null || user.getRole().isBlank() ? RoleNames.USER : user.getRole().trim().toUpperCase()))
                .toList();
    }
}
