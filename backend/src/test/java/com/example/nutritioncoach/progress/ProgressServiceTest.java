package com.example.nutritioncoach.progress;

import com.example.nutritioncoach.dto.ProgressRequest;
import com.example.nutritioncoach.user.UserAccount;
import com.example.nutritioncoach.user.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import com.example.nutritioncoach.mapper.ProgressMapper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProgressServiceTest {
    @Mock ProgressRepository progressRepository;
    @Mock UserAccountRepository userAccountRepository;
    @Spy ProgressMapper progressMapper = new ProgressMapper();

    @InjectMocks ProgressService progressService;

    @Test
    void listShouldReturnMappedItems() {
        UserAccount user = user();
        ProgressEntry entry = new ProgressEntry(user, LocalDate.of(2026, 5, 1), 72.2, "note");
        entry.setId(1L);
        when(progressRepository.findByUser_EmailIgnoreCaseOrderByEntryDateDesc("user@mail.com")).thenReturn(List.of(entry));
        var result = progressService.list("user@mail.com");
        assertEquals(1, result.size());
        assertEquals(72.2, result.get(0).weightKg());
    }

    @Test
    void createShouldSaveEntryForCurrentUser() {
        UserAccount user = user();
        when(userAccountRepository.findByEmailIgnoreCase("user@mail.com")).thenReturn(Optional.of(user));
        when(progressRepository.save(any(ProgressEntry.class))).thenAnswer(invocation -> {
            ProgressEntry entry = invocation.getArgument(0);
            entry.setId(10L);
            return entry;
        });
        var result = progressService.create("user@mail.com", new ProgressRequest(LocalDate.of(2026, 5, 17), 71.1, "start"));
        assertEquals(10L, result.id());
        assertEquals(71.1, result.weightKg());
        verify(progressRepository).save(any(ProgressEntry.class));
    }

    @Test
    void updateShouldModifyExistingEntry() {
        UserAccount user = user();
        ProgressEntry entry = new ProgressEntry(user, LocalDate.of(2026, 5, 1), 72.2, "note");
        entry.setId(15L);
        when(progressRepository.findByIdAndUser_EmailIgnoreCase(15L, "user@mail.com")).thenReturn(Optional.of(entry));
        when(progressRepository.save(any(ProgressEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var result = progressService.update("user@mail.com", 15L, new ProgressRequest(LocalDate.of(2026, 5, 18), 70.8, "updated"));
        assertEquals(LocalDate.of(2026, 5, 18), result.entryDate());
        assertEquals(70.8, result.weightKg());
        assertEquals("updated", result.note());
    }

    @Test
    void deleteShouldRemoveExistingEntry() {
        UserAccount user = user();
        ProgressEntry entry = new ProgressEntry(user, LocalDate.of(2026, 5, 1), 72.2, "note");
        entry.setId(19L);
        when(progressRepository.findByIdAndUser_EmailIgnoreCase(19L, "user@mail.com")).thenReturn(Optional.of(entry));
        progressService.delete("user@mail.com", 19L);
        verify(progressRepository).delete(entry);
    }


    @Test
    void getByIdShouldReturnEntryForCurrentUser() {
        UserAccount user = user();
        ProgressEntry entry = new ProgressEntry(user, LocalDate.of(2026, 5, 10), 73.3, "mid");
        entry.setId(21L);
        when(progressRepository.findByIdAndUser_EmailIgnoreCase(21L, "user@mail.com")).thenReturn(Optional.of(entry));

        var result = progressService.getById("user@mail.com", 21L);

        assertEquals(21L, result.id());
        assertEquals(73.3, result.weightKg());
    }

    @Test
    void searchShouldFilterByNoteAndDateRange() {
        UserAccount user = user();
        ProgressEntry first = new ProgressEntry(user, LocalDate.of(2026, 5, 1), 74.0, "start phase");
        first.setId(1L);
        ProgressEntry second = new ProgressEntry(user, LocalDate.of(2026, 5, 10), 73.0, "middle");
        second.setId(2L);
        ProgressEntry third = new ProgressEntry(user, LocalDate.of(2026, 5, 20), 72.0, "final phase");
        third.setId(3L);
        when(progressRepository.findByUser_EmailIgnoreCaseOrderByEntryDateDesc("user@mail.com")).thenReturn(List.of(third, second, first));

        var result = progressService.search("user@mail.com", "phase", LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31));

        assertEquals(2, result.size());
        assertEquals(3L, result.get(0).id());
        assertEquals(1L, result.get(1).id());
    }

    private static UserAccount user() {
        UserAccount user = new UserAccount("user@mail.com", "hashed", "Пользователь");
        user.setId(1L);
        return user;
    }
}
