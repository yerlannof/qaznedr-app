# Внедрение брендинга16 A

1. Зафиксировать выбор A и обновить правила CLAUDE. Оптимизировать `archive-to-field-chalk.png` в `public/brand/archive-to-field-chalk-1536.webp`.
2. Узкий кодовый агент: `BrandIllustration.tsx`, `BrandContour.tsx`, PortalWelcomeHero, HomePageContent, /about, /services, /insights и globals.css. Сначала регрессионные проверки CTA/порядка/условности/индекса, затем реализация, зелёный targeted Jest. Без новых строк translations или зависимостей.
3. Ведущий читает diff, проверяет размер/фон актива, запускает ESLint/build/full Jest с известным baseline. Production start3107, браузер64 сочетания плюс визуальная оценка. Исправляет находки.
4. Независимый сильный агент читает весь diff против спецификации; исправить существенные замечания. Записать доказательства в `docs/design/mockups/16/RELEASE.md`, DELIVERY/ROADMAP и текущий статус HOLDING_ROADMAP.
5. Коммит явными путями `feat(brand): unify editorial illustrations and contours`, push master, дождаться точных CI/Production success, проверить живые страницы/новый asset. Checkpoint документации отдельно при необходимости. Локальные mail/outreach не включать.
