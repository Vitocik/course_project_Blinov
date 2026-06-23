package com.example.nutritioncoach.mapper;

import com.example.nutritioncoach.dto.ProgressResponse;
import com.example.nutritioncoach.progress.ProgressEntry;
import org.springframework.stereotype.Component;

@Component
public class ProgressMapper {
    public ProgressResponse toDto(ProgressEntry entry) {
        if (entry == null) {
            return null;
        }
        return new ProgressResponse(entry.getId(), entry.getEntryDate(), entry.getWeightKg(), entry.getNote());
    }
}
