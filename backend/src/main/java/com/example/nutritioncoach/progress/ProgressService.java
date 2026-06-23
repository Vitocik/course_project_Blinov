package com.example.nutritioncoach.progress;

import com.example.nutritioncoach.dto.ProgressRequest;
import com.example.nutritioncoach.dto.ProgressResponse;
import com.example.nutritioncoach.mapper.ProgressMapper;
import com.example.nutritioncoach.user.UserAccountRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class ProgressService {
    private final ProgressRepository progressRepository;
    private final UserAccountRepository userAccountRepository;
    private final ProgressMapper progressMapper;

    public ProgressService(ProgressRepository progressRepository, UserAccountRepository userAccountRepository, ProgressMapper progressMapper) {
        this.progressRepository = progressRepository;
        this.userAccountRepository = userAccountRepository;
        this.progressMapper = progressMapper;
    }

    public List<ProgressResponse> list(String email) {
        return progressRepository.findByUser_EmailIgnoreCaseOrderByEntryDateDesc(email)
                .stream()
                .map(progressMapper::toDto)
                .toList();
    }

    @Transactional
    public ProgressResponse create(String email, ProgressRequest request) {
        var user = userAccountRepository.findByEmailIgnoreCase(email).orElseThrow();
        ProgressEntry entry = new ProgressEntry(user, request.entryDate(), request.weightKg(), request.note() == null ? "" : request.note());
        return progressMapper.toDto(progressRepository.save(entry));
    }

    @Transactional
    public ProgressResponse update(String email, Long id, ProgressRequest request) {
        ProgressEntry entry = progressRepository.findByIdAndUser_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Запись прогресса не найдена."));
        entry.setEntryDate(request.entryDate());
        entry.setWeightKg(request.weightKg());
        entry.setNote(request.note() == null ? "" : request.note());
        return progressMapper.toDto(progressRepository.save(entry));
    }

    public ProgressResponse getById(String email, Long id) {
        ProgressEntry entry = progressRepository.findByIdAndUser_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Запись прогресса не найдена."));
        return progressMapper.toDto(entry);
    }

    public List<ProgressResponse> search(String email, String query, LocalDate from, LocalDate to) {
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return list(email).stream()
                .filter(item -> from == null || !item.entryDate().isBefore(from))
                .filter(item -> to == null || !item.entryDate().isAfter(to))
                .filter(item -> normalizedQuery.isBlank() || (item.note() != null && item.note().toLowerCase(Locale.ROOT).contains(normalizedQuery)))
                .toList();
    }

    @Transactional
    public void delete(String email, Long id) {
        ProgressEntry entry = progressRepository.findByIdAndUser_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Запись прогресса не найдена."));
        progressRepository.delete(entry);
    }

}
