# План сессии 3в

Спецификация: `../specs/2026-09-26-session3c-reliability-accessibility-design.md`.

1. Ведущий: регрессионные тесты ошибки Supabase и API-кэша, затем исправление `src/lib/leads/public-queries.ts`, `src/app/api/leads/route.ts`. Тесты в `src/__tests__/lib/leads/` и `src/__tests__/app/api/leads/`.
2. Узкий агент Luna: тесты и нумерация таблиц (`content.ts`), alt индивидуальной OG-карточки (`metadata.ts`), точное название middleware-теста. Общую карточку не менять.
3. Ведущий: локализация skip-link в `translations.ts` и locale layout, фокусируемый main, устранение вложенного main 404, перенос крошек гайда. Тесты компонентов и проверка в браузере.
4. Точечный Jest, полный Jest, ESLint, build. Production server на 3107; матрица браузерных проверок и снимки вне репозитория.
5. Независимый агент Sol: полный diff против спецификации; ведущий проверяет выводы и исправляет существенное через тест.
6. Обновить HOLDING_ROADMAP: выполненное, блокеры дизайна/данных/доступа, точка продолжения. Один явный коммит `fix(holding): improve catalogue failures and accessibility`, push master после проверок. Дождаться успешного Production deployment своего SHA и проверить сайт.
7. Сессии 4–7: продолжать доступные задачи при утверждении/данных; незавершённое не объявлять готовым.
