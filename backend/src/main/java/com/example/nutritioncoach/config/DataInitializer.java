package com.example.nutritioncoach.config;

import com.example.nutritioncoach.meal.Meal;
import com.example.nutritioncoach.meal.MealRepository;
import com.example.nutritioncoach.user.RoleNames;
import com.example.nutritioncoach.user.UserAccount;
import com.example.nutritioncoach.user.UserAccountRepository;
import com.example.nutritioncoach.workout.WorkoutPlan;
import com.example.nutritioncoach.workout.WorkoutRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedUsers(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            MealRepository mealRepository,
            WorkoutRepository workoutRepository
    ) {
        return args -> {
            createIfMissing(userAccountRepository, passwordEncoder,
                    "admin@coach.local", "admin1234", "Администратор", RoleNames.ADMIN);
            createIfMissing(userAccountRepository, passwordEncoder,
                    "demo@coach.local", "demo1234", "Демонстрационный пользователь", RoleNames.USER);

            seedDemoMealsAndWorkouts(userAccountRepository, mealRepository, workoutRepository);
        };
    }

    private void seedDemoMealsAndWorkouts(UserAccountRepository userAccountRepository,
                                          MealRepository mealRepository,
                                          WorkoutRepository workoutRepository) {
        userAccountRepository.findByEmailIgnoreCase("demo@coach.local").ifPresent(user -> {
            if (mealRepository.findByUser_EmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail()).isEmpty()) {
                mealRepository.save(new Meal("Овсянка с бананом", 420, 18, 11, 64, "Завтрак",
                        "Демо-блюдо для отображения CRUD", user));
                mealRepository.save(new Meal("Курица с рисом и овощами", 610, 42, 18, 62, "Обед",
                        "Сбалансированный обед после тренировки", user));
            }

            if (workoutRepository.findByUser_EmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail()).isEmpty()) {
                workoutRepository.save(new WorkoutPlan("Силовая база", "Full body", 45, 320,
                        "Базовая тренировка на всё тело с упором на технику.", user));
                workoutRepository.save(new WorkoutPlan("Кардио + кор", "Conditioning", 35, 280,
                        "Интервальная работа для выносливости и кора.", user));
            }
        });
    }

    private void createIfMissing(UserAccountRepository userAccountRepository,
                                 PasswordEncoder passwordEncoder,
                                 String email,
                                 String password,
                                 String fullName,
                                 String role) {
        if (userAccountRepository.findByEmailIgnoreCase(email).isEmpty()) {
            userAccountRepository.save(new UserAccount(email, passwordEncoder.encode(password), fullName, role));
        }
    }
}
