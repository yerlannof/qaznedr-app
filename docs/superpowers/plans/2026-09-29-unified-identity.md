# Единая идентичность — исполнение

1. Синхронизация4cede1c, Production6721454920success. Локальный mail-review heartbeat сохранить, не включать в этот коммит.
2. Sol: закрытая migration/accounts+profiles RPC, TS adapter и unit/SQL tests; точные пути в задании.
3. Ведущий: TDD auth.config callback checks, env-admin compatibility, one-config alias и проверка административного shortcut.
4. Изолированная PostgreSQL: роль user, один ID при повторе, запрет email-link, атомарный rollback, закрытые grants.
5. Focused/full Jest, ESLint/TypeScript/build/format. Независимый сильный reviewer; prodproviders/registration/APIclosed afterpush. Не включать Google и не применять миграцию на production.

## Выполнено

- Все пять этапов подготовки и локальной проверки выполнены; отдельное сильное ревью — Ready.
- В ходе работы другой исполнитель опубликовал `6615d30` (пустая витрина на главной). HEAD/origin/master/Production сверены на этом SHA, Production6722700795success; конфликтов нет. Выпуск идентичности следует поверх него.
- 19 focused pass; полный Jest1825 pass/28 прежних failures, ESLint/tsc/build успешны. Локальный PostgreSQL smoke и пять конкурентных первых входов прошли; тестовая БД удалена.
- Миграция закрывает прежний прямой доступ к profiles. До её применения нужен сессионный серверный API профиля и проверка всех legacy consumers. Публичный OAuth и форма ещё не запускаются.
- При выпуске проверить CI, exact-SHA Production success и повторить локальный HTTP-протокол на production.
