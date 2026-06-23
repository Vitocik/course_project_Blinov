package com.example.nutritioncoach.progress;

import com.example.nutritioncoach.dto.ProgressRequest;
import com.example.nutritioncoach.dto.ProgressResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/progress")
@Tag(name = "Progress", description = "Прогресс пользователя")
public class ProgressController {
    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    @Operation(summary = "Список записей прогресса")
    public List<ProgressResponse> list(Authentication authentication) {
        return progressService.list(authentication.getName());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Запись прогресса по ID")
    public ProgressResponse getById(Authentication authentication, @PathVariable Long id) {
        return progressService.getById(authentication.getName(), id);
    }

    @GetMapping("/search")
    @Operation(summary = "Поиск записей прогресса")
    public List<ProgressResponse> search(
            Authentication authentication,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return progressService.search(authentication.getName(), query, from, to);
    }

    @PostMapping
    @Operation(summary = "Создать запись прогресса")
    public ProgressResponse create(Authentication authentication, @Valid @RequestBody ProgressRequest request) {
        return progressService.create(authentication.getName(), request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить запись прогресса")
    public ProgressResponse update(Authentication authentication, @PathVariable Long id, @Valid @RequestBody ProgressRequest request) {
        return progressService.update(authentication.getName(), id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить запись прогресса")
    public void delete(Authentication authentication, @PathVariable Long id) {
        progressService.delete(authentication.getName(), id);
    }
}
