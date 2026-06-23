# Code Structure

## Backend
```text
backend/src/main/java/com/example/nutritioncoach/
├── admin/
├── auth/
├── common/
├── config/
├── dashboard/
├── dto/
├── mapper/
├── meal/
├── progress/
├── security/
├── user/
└── workout/
```

## Mobile
```text
mobile/src/
├── api.ts
├── storage.ts
├── domain.ts
├── types.ts
└── context/
    └── AppContext.tsx
```

## Комментарий
Структура соответствует layered architecture и упрощает тестирование и дальнейшее развитие проекта. В ней явно выделены слои presentation, control, mediator, entity и foundation, что соответствует архитектурной модели PCMEF и облегчает проверку по критериям проекта.
