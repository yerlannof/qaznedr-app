# Собственный профиль — исполнение

1. HEAD/origin/Production b3f6bfd, deployment6722792986success; heartbeat mail-review сохранить отдельно.
2. Sol: own-profile.ts validation/repository и зеркальный test; ведущий: API routes, handler и HTTP contract tests. Только явные пути.
3. TDD: тесты → ожидаемое падение → код. Закрыть legacy setup в том же флаге, сохранить конверты.
4. Аудит оставшегося legacy profile access и продолжение безопасных фото. Не применять DB migration/не включать Google.
5. Focused/full tests, lint/build/tsc, локальный HTTP closed + независимое ревью. UI не меняется.
6. Roadmap/report → explicit commit → push → exact CI/Production success → live HTTP.

## Проверка

33focused pass; полный Jest1859pass/27 прежних failures пяти наборов, flakyCSRF прошёл. ESLint/TypeScript/build успешны. Независимое сильное ревью Ready. Локально закрытые profile GET/PUT/setupPOST404/no-store; providers200 credentials; RU200. Флаг и migration в production не меняются. Аудит remaining profiles consumers сохранён в release report. Публичный UI не менялся.
