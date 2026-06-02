package com.example.nutritioncoach.admin;

import com.example.nutritioncoach.dto.UserDto;
import com.example.nutritioncoach.user.RoleNames;
import com.example.nutritioncoach.user.UserAccount;
import com.example.nutritioncoach.user.UserAccountRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminControllerTest {

    @Test
    void users_shouldReturnMappedUsers() {

        UserAccountRepository repository =
                mock(UserAccountRepository.class);

        AdminController controller =
                new AdminController(repository);

        UserAccount user = new UserAccount();
        user.setId(1L);
        user.setEmail("test@test.com");
        user.setFullName("Test User");
        user.setRole("ADMIN");

        when(repository.findAll())
                .thenReturn(List.of(user));

        List<UserDto> result = controller.users();

        assertEquals(1, result.size());

        UserDto dto = result.get(0);

        assertEquals(1L, dto.id());
        assertEquals("test@test.com", dto.email());
        assertEquals("Test User", dto.fullName());
        assertEquals("ADMIN", dto.role());

        verify(repository).findAll();
    }

    @Test
    void users_shouldUseDefaultRoleWhenRoleIsNull() {

        UserAccountRepository repository =
                mock(UserAccountRepository.class);

        AdminController controller =
                new AdminController(repository);

        UserAccount user = new UserAccount();
        user.setId(2L);
        user.setEmail("user@test.com");
        user.setFullName("Regular User");
        user.setRole(null);

        when(repository.findAll())
                .thenReturn(List.of(user));

        List<UserDto> result = controller.users();

        assertEquals(RoleNames.USER,
                result.get(0).role());
    }

    @Test
    void users_shouldUseDefaultRoleWhenRoleIsBlank() {

        UserAccountRepository repository =
                mock(UserAccountRepository.class);

        AdminController controller =
                new AdminController(repository);

        UserAccount user = new UserAccount();
        user.setId(3L);
        user.setEmail("blank@test.com");
        user.setFullName("Blank Role");
        user.setRole("   ");

        when(repository.findAll())
                .thenReturn(List.of(user));

        List<UserDto> result = controller.users();

        assertEquals(RoleNames.USER,
                result.get(0).role());
    }

    @Test
    void users_shouldTrimAndUppercaseRole() {

        UserAccountRepository repository =
                mock(UserAccountRepository.class);

        AdminController controller =
                new AdminController(repository);

        UserAccount user = new UserAccount();
        user.setId(4L);
        user.setEmail("manager@test.com");
        user.setFullName("Manager");
        user.setRole(" manager ");

        when(repository.findAll())
                .thenReturn(List.of(user));

        List<UserDto> result = controller.users();

        assertEquals("MANAGER",
                result.get(0).role());
    }
}