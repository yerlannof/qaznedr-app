# План — доводка измерений и контент

1. Сверить HEAD/origin/Production; прочитать текущие статусы. Выполнено: 29accd8, Production success.
2. Воспроизвести `prettier --list-different .`: 32 старых design HTML/CJS + 2 verification HTML; отдельно незакоммиченный почтовый журнал.
3. Форматировать ровно выявленные макеты, добавить 2 точных verification-пути в .prettierignore. Не исключать будущие макеты/исходники целыми каталогами.
4. TDD referrer: только src/lib/analytics/providers.ts и src/__tests__/lib/analytics/providers.test.ts. Исполнитель growth_next_audit; ведущий проверяет итог.
5. Проверить доступные отчёты, сохранить факты в docs/visibility/2026-09-28-growth-followthrough.md. Отдельно подготовить docs/copy/2026-09-28-geological-map-guide-draft.md; не публиковать до утверждения.
6. Проверки: Prettier, targeted/full Jest, ESLint, build, браузер; независимый review. Зафиксировать старые падения без подмены успехом CI (test job continue-on-error).
7. Обновить roadmap и записи; явные пути git add; push origin master; дождаться CI и Production, проверить HTTP/синхронизацию. Черновик показать владельцу для одного финального решения.
