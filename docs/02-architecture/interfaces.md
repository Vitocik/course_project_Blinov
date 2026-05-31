# Interfaces

## Mobile interfaces
- `AppContextValue` — глобальное состояние приложения;
- `AppState` — состояние авторизации, профиля, списков и темы;
- `MealRecord`, `WorkoutRecord`, `ProgressEntry` — типы данных для UI.

## Backend interfaces
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Profile
- `GET /api/profile/me`
- `PUT /api/profile/me`

### Dashboard
- `GET /api/dashboard/summary`

### Nutrition
- `GET /api/nutrition/plan`

### Workouts
- `GET /api/workouts/plan`

### CRUD
- `/api/meals`
- `/api/workout-plans`
- `/api/progress`

## Контракт обмена
Все ответы API передаются в JSON.  
Mobile преобразует данные в локальные модели и сохраняет часть из них в AsyncStorage.
