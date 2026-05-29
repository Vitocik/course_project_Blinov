package com.example.nutritioncoach.meal;

import com.example.nutritioncoach.dto.MealItemResponse;
import com.example.nutritioncoach.dto.MealPlanResponse;
import com.example.nutritioncoach.mapper.MealMapper;
import com.example.nutritioncoach.user.UserProfile;
import com.example.nutritioncoach.user.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NutritionService {
    private final UserProfileRepository profileRepository;
    private final MealMapper mealMapper;

    public NutritionService(UserProfileRepository profileRepository, MealMapper mealMapper) {
        this.profileRepository = profileRepository;
        this.mealMapper = mealMapper;
    }

    public MealPlanResponse generate(String email) {
        UserProfile profile = profileRepository.findByUser_EmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Заполни профиль, чтобы сгенерировать план питания."));

        Metrics metrics = calculateMetrics(profile);
        List<MealItemResponse> items = switch (profile.getGoal()) {
            case "lose_weight" -> List.of(
                    meal("Завтрак", "Овсянка с ягодами и йогуртом", metrics, 0.25, "Белки и сложные углеводы для мягкого дефицита"),
                    meal("Обед", "Куриная грудка с гречкой и салатом", metrics, 0.30, "Сытный обед без лишних калорий"),
                    meal("Перекус", "Творог и яблоко", metrics, 0.10, "Лёгкий перекус между приёмами пищи"),
                    meal("Ужин", "Лосось с овощами на пару", metrics, 0.25, "Белок и полезные жиры"),
                    meal("Перед сном", "Кефир и орехи", metrics, 0.10, "Небольшой приём пищи перед сном")
            );
            case "gain_muscle" -> List.of(
                    meal("Завтрак", "Овсянка с бананом, яйцом и арахисовой пастой", metrics, 0.25, "Завтрак с повышенной калорийностью"),
                    meal("Обед", "Паста с курицей и овощами", metrics, 0.30, "Плотный обед для восстановления"),
                    meal("Перекус", "Протеиновый перекус с фруктом", metrics, 0.10, "Дополнительные калории между приёмами пищи"),
                    meal("Ужин", "Говядина с рисом и овощами", metrics, 0.25, "Ужин для набора массы"),
                    meal("Перед сном", "Сырники с йогуртом", metrics, 0.10, "Дополнительный белок перед сном")
            );
            default -> List.of(
                    meal("Завтрак", "Омлет с овощами и цельнозерновым тостом", metrics, 0.25, "Баланс белков и углеводов"),
                    meal("Обед", "Индейка с рисом и салатом", metrics, 0.30, "Основной приём пищи для стабильного режима"),
                    meal("Перекус", "Йогурт, банан и немного орехов", metrics, 0.10, "Лёгкий перекус"),
                    meal("Ужин", "Рыба с картофелем и брокколи", metrics, 0.25, "Сытный ужин"),
                    meal("Перед сном", "Творог с ягодами", metrics, 0.10, "Лёгкий вечерний вариант")
            );
        };

        return mealMapper.toPlanResponse(metrics.calories, metrics.protein, metrics.fats, metrics.carbs, items);
    }

    private MealItemResponse meal(String mealType, String name, Metrics metrics, double share, String note) {
        return mealMapper.toItemResponse(
                mealType,
                name,
                Math.max(100, (int) Math.round(metrics.calories * share)),
                Math.max(8, (int) Math.round(metrics.protein * share)),
                Math.max(10, (int) Math.round(metrics.carbs * share)),
                Math.max(5, (int) Math.round(metrics.fats * share)),
                note
        );
    }

    private Metrics calculateMetrics(UserProfile profile) {
        int sexOffset = "male".equalsIgnoreCase(profile.getSex()) ? 5 : -161;
        double activityFactor = switch (String.valueOf(profile.getActivity())) {
            case "low" -> 1.2;
            case "high" -> 1.7;
            default -> 1.45;
        };

        double bmr = 10 * profile.getWeightKg() + 6.25 * profile.getHeightCm() - 5 * profile.getAge() + sexOffset;
        int tdee = (int) Math.round(bmr * activityFactor);

        int goalAdjustment = switch (String.valueOf(profile.getGoal())) {
            case "lose_weight" -> -350;
            case "gain_muscle" -> 250;
            default -> 0;
        };

        int calories = Math.max(1400, tdee + goalAdjustment);
        int protein = (int) Math.round(profile.getWeightKg() * ("gain_muscle".equals(profile.getGoal()) ? 1.8 : 1.6));
        int fats = (int) Math.round(profile.getWeightKg() * 0.9);
        int carbs = Math.max(80, (int) Math.round((calories - protein * 4 - fats * 9) / 4.0));
        return new Metrics(calories, protein, fats, carbs);
    }

    private record Metrics(int calories, int protein, int fats, int carbs) {}
}
