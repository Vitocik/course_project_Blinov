# Nutrition Coach

## О проекте

**Nutrition Coach** — кроссплатформенное мобильное приложение для подбора питания, тренировок и отслеживания прогресса пользователя.  
Проект выполнен в рамках курсовой работы по дисциплине мобильной разработки.

Приложение позволяет:

- регистрироваться и авторизовываться через JWT;
- работать с ролями `USER` и `ADMIN`;
- просматривать, создавать, редактировать и удалять блюда;
- просматривать, создавать, редактировать и удалять тренировки;
- отслеживать прогресс и историю изменений;
- использовать светлую и тёмную тему;
- работать с локальным кэшированием для частичной оффлайн-доступности;
- взаимодействовать с REST API backend-сервера.

---

## Используемый стек технологий

### Mobile
- React Native
- Expo
- TypeScript
- Axios
- AsyncStorage
- React Navigation
- Context API

### Backend
- Java 21
- Spring Boot 3.4.x
- Spring Security
- Spring Data JPA
- JWT Authentication
- PostgreSQL
- H2 Database dependencies
- Maven
- Swagger / OpenAPI
- JaCoCo
- JUnit 5
- Mockito

---

## Требования к окружению

| Компонент | Требование | Зачем нужен |
|---|---|---|
| Операционная система | Windows 10/11, macOS или Linux | Запуск backend и mobile |
| Java Development Kit | JDK 21 | Сборка и запуск Spring Boot backend |
| Maven | 3.9+ | Сборка backend-проекта |
| Node.js | LTS-версия | Запуск Expo/React Native приложения |
| npm | Входит в состав Node.js | Установка зависимостей mobile |
| PostgreSQL | 16.x | Основная база данных проекта |
| Expo Go или Android Studio | По необходимости | Запуск приложения на устройстве или эмуляторе |
| Git | Любая актуальная версия | Работа с репозиторием |

---

## Структура проекта

```text
course_project_Blinov/
├── backend/          # Spring Boot backend
├── mobile/           # React Native / Expo приложение
├── docs/             # Вся проектная документация
├── docker-compose.yml
├── README.md
└── LICENSE           # файл лицензии MIT
```

---

## Архитектура (PCMEF)

Проект организован в клиент-серверной архитектуре с разделением backend по слоям.  
Для описания структуры удобно использовать модель **PCMEF (Presentation-Control-Mediator-Entity-Foundation)**.

| Слой | Расположение в проекте | Ответственность |
|---|---|---|
| Presentation (P) | `mobile/` | Интерфейс пользователя, экраны, навигация, ввод данных |
| Control (C) | `backend/.../controller` | REST API, обработка запросов, валидация DTO, точки входа |
| Mediator (M) | `backend/.../service` | Бизнес-логика, сценарии работы, транзакции |
| Entity (E) | `backend/.../entity` | JPA-сущности и доменные объекты |
| Foundation (F) | `backend/.../repository`, `backend/.../config` | Доступ к БД, конфигурация, безопасность, инициализация |

---

## Функциональные возможности

### Авторизация и безопасность
- регистрация пользователя;
- вход в систему по JWT;
- роли `USER` и `ADMIN`;
- защита части API через Spring Security;
- хранение токена в локальном хранилище.

### Питание
- список блюд;
- карточка блюда;
- создание и редактирование собственных блюд;
- удаление блюд;
- поиск и фильтрация.

### Тренировки
- список тренировок;
- просмотр деталей тренировки;
- создание и редактирование тренировок;
- удаление тренировок.

### Профиль и прогресс
- редактирование профиля;
- отображение параметров пользователя;
- запись прогресса;
- история изменений.

### Интерфейс
- светлая и тёмная тема;
- сохранение настроек;
- локальное кэширование данных;
- адаптация под мобильный сценарий использования.

---

## REST API

Backend предоставляет REST API, которое используется мобильным приложением.

### Основные группы эндпоинтов
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/meals`
- `GET /api/meals/{id}`
- `POST /api/meals`
- `PUT /api/meals/{id}`
- `DELETE /api/meals/{id}`
- `GET /api/workouts`
- `GET /api/workouts/{id}`
- `POST /api/workouts`
- `PUT /api/workouts/{id}`
- `DELETE /api/workouts/{id}`
- `GET /api/progress`
- `POST /api/progress`
- `DELETE /api/progress/{id}`

### Документация API
Swagger UI:

```text
http://localhost:8080/swagger-ui/index.html
```

OpenAPI JSON:

```text
http://localhost:8080/v3/api-docs
```

---

## База данных

Основная база данных — **PostgreSQL**.

Ключевые таблицы проекта:
- users
- profiles
- meals
- workouts
- progress_entries

ORM реализована через **Spring Data JPA / Hibernate**.

> Важно: параметры подключения к БД должны совпадать в `docker-compose.yml` и `backend/src/main/resources/application-postgres.yml`.

---

## Структура документации

Вся документация находится в папке `docs/`:

| Папка | Содержимое |
|--------|------------|
| `00-project-charter/` | Паспорт проекта, цели, задачи, заинтересованные стороны |
| `01-requirements/` | Анализ предметной области, функциональные и нефункциональные требования, сценарии использования |
| `02-architecture/` | Архитектурное описание системы, диаграмма PCMEF, описание компонентов и взаимодействий |
| `03-database/` | Модель данных, ER-диаграмма, структура базы данных и SQL-скрипты |
| `04-detailed-design/` | Детальное проектирование, UML-диаграммы, диаграммы последовательностей и классов |
| `05-implementation/` | Описание реализации мобильного клиента и серверной части, структура исходного кода |
| `06-testing/` | План тестирования, тестовые сценарии и результаты проверки функциональности |
| `07-refactoring/` | Проведённый рефакторинг, улучшения архитектуры и качества кода |
| `08-ui/` | Макеты и скриншоты пользовательского интерфейса |
| `09-api/` | Описание REST API, доступные эндпоинты и примеры запросов |
| `10-deployment/` | Инструкция по развертыванию и запуску проекта |
| `11-user-guide/` | Руководство пользователя по работе с приложением |
| `12-final-report/` | Итоговый отчёт по курсовому проекту и материалы для защиты |
| `images/` | Изображения, диаграммы и графические материалы документации |
---

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/Vitocik/course_project_Blinov.git
cd course_project_Blinov
```

### 2. Запуск backend

Перейти в папку backend:

```bash
cd backend
```

Установить и запустить проект:

```bash
mvn clean install
mvn spring-boot:run
```

Backend по умолчанию запускается на:

```text
http://localhost:8080
```

### 3. Подключение PostgreSQL

Если используешь PostgreSQL, проверь, что параметры подключения совпадают в:

- `backend/src/main/resources/application-postgres.yml`

Для быстрого старта можно поднять базу через Docker:

```bash
docker compose up -d
```

### 4. Запуск mobile-приложения

Перейти в папку mobile:

```bash
cd ../mobile
```

Установить зависимости:

```bash
npm install
```

Запустить Expo:

```bash
npx expo start
```

Если запускаешь приложение на физическом телефоне, можно использовать `ngrok` и указать внешний адрес backend в настройках приложения.
После запуска ngrok скопируй выданный `https://...ngrok-free.app` адрес и вставь его в поле `API URL` внутри приложения.

---

## Тестирование

Для backend-проекта используются:

- JUnit 5
- Mockito
- Spring Boot Test
- JaCoCo

Запуск тестов:

```bash
mvn test
```

Отчёт JaCoCo:

```text
backend/target/site/jacoco/index.html
```

---

## Лицензия

Проект распространяется под лицензией **MIT**.  

---

## Полезные ссылки

- Репозиторий проекта
- Документация: `docs/`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
