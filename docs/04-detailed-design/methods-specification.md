# Спецификация методов

## Ключевые методы backend
- `AuthService.register()` — создание нового аккаунта;
- `AuthService.login()` — проверка учётных данных и выдача JWT;
- `DashboardService.summary()` — формирование сводки по пользователю;
- `MealService.list()/create()/update()/delete()` — управление блюдами;
- `WorkoutCrudService.list()/create()/update()/delete()` — управление тренировками;
- `ProgressService.list()/addEntry()/delete()` — работа с прогрессом;
- `ProfileService.getProfile()/saveProfile()` — работа с профилем;
- `JwtService.generateToken()` — выпуск токена доступа.

## Назначение
Документ помогает связать последовательности вызовов с конкретными сервисами и контроллерами.
