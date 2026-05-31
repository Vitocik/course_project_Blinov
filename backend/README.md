# Nutrition Coach backend

## Запуск

### H2 (по умолчанию)

```bash
mvn spring-boot:run
```

### PostgreSQL

```bash
docker compose up -d
set SPRING_PROFILES_ACTIVE=postgres
mvn spring-boot:run
```

### Доступ с телефона через ngrok

1. Запусти backend на компьютере.
2. В отдельном окне выполни:

```bash
ngrok http 8080
```

3. Скопируй выданный `https://...ngrok-free.app` адрес.
4. В приложении укажи его в поле `API URL`.


## Swagger

После запуска:

- `http://localhost:8080/swagger-ui.html`

## Health

- `GET /api/health`

## Тесты

```bash
mvn test
```

Отчёт покрытия JaCoCo:

- `target/site/jacoco/index.html`
