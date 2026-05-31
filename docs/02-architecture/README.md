# 02. Architecture

Проект построен на архитектурном паттерне **PCMEF**:
Presentation — Control — Mediator — Entity — Foundation.

## Состав раздела
- `pcmef-diagram.md`
- `interfaces.md`
- `adr.md`

## Слои
- **Presentation** — UI в мобильном приложении.
- **Control** — REST-контроллеры и валидация.
- **Mediator** — бизнес-логика и транзакции.
- **Entity** — JPA-сущности.
- **Foundation** — репозитории и доступ к данным.
