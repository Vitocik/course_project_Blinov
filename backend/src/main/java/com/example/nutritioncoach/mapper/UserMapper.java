package com.example.nutritioncoach.mapper;

import com.example.nutritioncoach.dto.UserDto;
import com.example.nutritioncoach.user.UserAccount;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserDto toDto(UserAccount user) {
        if (user == null) {
            return null;
        }
        return new UserDto(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
