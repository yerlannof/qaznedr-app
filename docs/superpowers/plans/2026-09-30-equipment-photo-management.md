# План: закрытое управление фотографиями

1. Ведущий: контракт/SQL migration/SQL tests. Sol medium: точные HTTP/routes и
   repository файлы, mirrored TDD. Файлы исполнителей не пересекаются.
2. Red→green meaningful tests; локальная PostgreSQL со storage fixture и FK,
   stale/permission/rollback/order/queue/snapshot и параллельные гонки.
3. Ведущий лично проверяет diff. Отдельный сильный reviewer: весь пакет против
   спецификации; значимые замечания исправляются red→green.
4. Focused/full Jest, ESLint, prettier, build. Локальные закрытые HTTP, затем
   explicit git add, pushmaster, exact CI/Production success и живые404/no-store.
5. RELEASE/roadmap, checkpoint и финальная синхронизация. Mail/outreach dirty
   journals исключить. Публичный UI/БД/флаги/контент не меняются; IndexNow не нужен.

Дальше: проверенный cleanup worker/retention и квоты, полный live Storage/HTTP
lifecycle, утверждённая форма и модераторский экран. Этот шаг не запускает каталог.
