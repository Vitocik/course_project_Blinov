package com.example.nutritioncoach.progress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProgressRepository extends JpaRepository<ProgressEntry, Long> {
    List<ProgressEntry> findByUser_EmailIgnoreCaseOrderByEntryDateDesc(String email);
    Optional<ProgressEntry> findByIdAndUser_EmailIgnoreCase(Long id, String email);
}
