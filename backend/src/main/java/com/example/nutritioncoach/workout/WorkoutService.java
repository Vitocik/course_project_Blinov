package com.example.nutritioncoach.workout;

import com.example.nutritioncoach.dto.WorkoutDayResponse;
import com.example.nutritioncoach.dto.WorkoutExerciseResponse;
import com.example.nutritioncoach.dto.WorkoutPlanResponse;
import com.example.nutritioncoach.mapper.WorkoutMapper;
import com.example.nutritioncoach.user.UserProfile;
import com.example.nutritioncoach.user.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkoutService {
    private final UserProfileRepository profileRepository;
    private final WorkoutMapper workoutMapper;

    public WorkoutService(UserProfileRepository profileRepository, WorkoutMapper workoutMapper) {
        this.profileRepository = profileRepository;
        this.workoutMapper = workoutMapper;
    }

    public WorkoutPlanResponse generate(String email) {
        UserProfile profile = profileRepository.findByUser_EmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Заполни профиль, чтобы сгенерировать план тренировок."));

        List<WorkoutDayResponse> days = switch (profile.getGoal()) {
            case "lose_weight" -> List.of(
                    day("День 1", "Кардио + всё тело", ex(
                            new WorkoutExerciseResponse("Разминка на дорожке", "1", "10 мин"),
                            new WorkoutExerciseResponse("Приседания", "3", "15"),
                            new WorkoutExerciseResponse("Отжимания", "3", "12"),
                            new WorkoutExerciseResponse("Планка", "3", "30 сек")
                    )),
                    day("День 2", "Низ тела + пресс", ex(
                            new WorkoutExerciseResponse("Выпады", "3", "12 на ногу"),
                            new WorkoutExerciseResponse("Ягодичный мост", "3", "15"),
                            new WorkoutExerciseResponse("Скручивания", "3", "20"),
                            new WorkoutExerciseResponse("Велосипед", "3", "30 сек")
                    )),
                    day("День 3", "Интервалы", ex(
                            new WorkoutExerciseResponse("Бег на месте", "6", "45 сек"),
                            new WorkoutExerciseResponse("Берпи", "4", "10"),
                            new WorkoutExerciseResponse("Альпинист", "4", "20"),
                            new WorkoutExerciseResponse("Растяжка", "1", "8 мин")
                    ))
            );
            case "gain_muscle" -> List.of(
                    day("День 1", "Грудь + трицепс", ex(
                            new WorkoutExerciseResponse("Жим лёжа", "4", "8"),
                            new WorkoutExerciseResponse("Отжимания на брусьях", "4", "8"),
                            new WorkoutExerciseResponse("Разведения гантелей", "3", "12"),
                            new WorkoutExerciseResponse("Французский жим", "3", "10")
                    )),
                    day("День 2", "Спина + бицепс", ex(
                            new WorkoutExerciseResponse("Тяга штанги", "4", "8"),
                            new WorkoutExerciseResponse("Подтягивания", "4", "макс"),
                            new WorkoutExerciseResponse("Сгибания на бицепс", "3", "10"),
                            new WorkoutExerciseResponse("Гиперэкстензия", "3", "15")
                    )),
                    day("День 3", "Ноги + плечи", ex(
                            new WorkoutExerciseResponse("Приседания со штангой", "4", "8"),
                            new WorkoutExerciseResponse("Жим гантелей вверх", "4", "10"),
                            new WorkoutExerciseResponse("Выпады", "3", "12"),
                            new WorkoutExerciseResponse("Подъёмы на икры", "4", "15")
                    ))
            );
            default -> List.of(
                    day("День 1", "Силовая база", ex(
                            new WorkoutExerciseResponse("Приседания", "3", "12"),
                            new WorkoutExerciseResponse("Жим от пола", "3", "12"),
                            new WorkoutExerciseResponse("Тяга резинки", "3", "15"),
                            new WorkoutExerciseResponse("Планка", "3", "40 сек")
                    )),
                    day("День 2", "Кардио и кор", ex(
                            new WorkoutExerciseResponse("Ходьба/бег", "1", "20 мин"),
                            new WorkoutExerciseResponse("Скручивания", "3", "20"),
                            new WorkoutExerciseResponse("Мостик", "3", "15"),
                            new WorkoutExerciseResponse("Растяжка", "1", "8 мин")
                    )),
                    day("День 3", "Тонус мышц", ex(
                            new WorkoutExerciseResponse("Выпады", "3", "10 на ногу"),
                            new WorkoutExerciseResponse("Жим гантелей", "3", "12"),
                            new WorkoutExerciseResponse("Тяга в наклоне", "3", "12"),
                            new WorkoutExerciseResponse("Планка боковая", "3", "25 сек")
                    ))
            );
        };

        int count = Math.max(3, Math.min(profile.getTrainingDays(), days.size()));
        return workoutMapper.toPlanResponse(days.subList(0, count));
    }

    private List<WorkoutExerciseResponse> ex(WorkoutExerciseResponse... items) {
        return List.of(items);
    }

    private WorkoutDayResponse day(String day, String focus, List<WorkoutExerciseResponse> exercises) {
        return workoutMapper.toDayResponse(day, focus, exercises);
    }
}
