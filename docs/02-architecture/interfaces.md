# Interfaces

## Контракты между слоями

### Mobile ↔ Backend
- обмен данными через JSON;
- авторизация через JWT в заголовке `Authorization`;
- локальное хранение части данных в AsyncStorage;
- сетевые запросы через REST API.

### Control ↔ Mediator
- контроллеры принимают HTTP-запросы;
- сервисы реализуют бизнес-логику;
- DTO используются для ввода и вывода данных.

### Mediator ↔ Foundation
- сервисы работают с репозиториями;
- репозитории инкапсулируют доступ к БД;
- конфигурация, безопасность и инициализация вынесены отдельно.

## Основные интерфейсы backend
- `AuthController` / `AuthService`
- `ProfileController` / `ProfileService`
- `DashboardController` / `DashboardService`
- `MealController` / `MealService`
- `WorkoutCrudController` / `WorkoutCrudService`
- `ProgressController` / `ProgressService`
- `AdminController` / `UserAccountRepository`

## Основные DTO
- `AuthRequest`, `AuthResponse`
- `ProfileResponse`, `ProfileUpsertRequest`
- `MealResponse`, `MealUpsertRequest`
- `WorkoutResponse`, `WorkoutUpsertRequest`
- `ProgressResponse`, `ProgressRequest`
- `DashboardResponse`

## Контракт обмена
Все ответы API передаются в JSON, а мобильный клиент преобразует их в локальные модели и отображает в интерфейсе.
