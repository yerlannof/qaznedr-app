# Исполнение закрытого API

1. База синхронизации eb01a19, Production6721167305 success.
2. Sol medium: repository, новая SQL-миграция, unit TDD и SQL smoke; точные пути в задании, без production.
3. Astra: серверные handlers/routes, закрытие legacy регистрации, TDD для входа/ролей/CSRF/версий/валидации/недоступности.
4. Изолированная PostgreSQL: миграция и роли, атомарный конфликт, события, приватность. Никаких production-строк.
5. Focused Jest → весь Jest против baseline → ESLint/tsc/build → локальная/production проверка закрытых маршрутов. UI не меняется.
6. Сильный независимый reviewer всего diff, исправления. Явные пути commit/push, CI/Production success, журнал и точка продолжения.
