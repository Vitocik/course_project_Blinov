# 06. Implementation

## Реализация backend
Backend построен на Spring Boot и разделён на:
- controllers;
- services;
- repositories;
- entities;
- DTO;
- security;
- exception handling;
- configuration.

## Реализация mobile
Mobile-приложение использует:
- `App.tsx` как входную точку;
- `AppContext` для глобального состояния;
- `api.ts` для запросов к backend;
- `storage.ts` для AsyncStorage;
- `domain.ts` для локальной бизнес-логики;
- `types.ts` для типизации данных.

## Особенности реализации
- demo/offline mode;
- автоматическая синхронизация;
- сохранение состояния между перезапусками;
- role-aware UI;
- единый слой работы с API.
