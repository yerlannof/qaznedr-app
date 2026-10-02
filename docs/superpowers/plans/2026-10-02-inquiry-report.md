# План: отчёт существующих заявок

Спецификация: ../specs/2026-10-02-inquiry-report-design.md.

- [x] Синхронизация 64dc212, Production success. Проверены event dimensions Vercel, read-only count и два QA UUID.
- [x] TDD модуля src/lib/inquiries/report.ts и src/__tests__/lib/inquiries/report.test.ts; список QA в src/lib/inquiries/report-exclusions.ts.
- [x] TDD admin API src/app/api/admin/inquiries/report/route.ts и src/__tests__/api/admin-inquiries-report.route.test.ts.
- [x] CLI scripts/report-inquiries.ts, внутренний отчёт docs/visibility/2026-10-02-inquiry-report.md.
- [x] Отдельный черновик доказательств команды/кейса: docs/content-drafts/2026-10-02-investor-evidence-gaps.md; не публиковать.
- [x] Точечные тесты, все Jest с baseline, ESLint/format/build, HTTP/browser, read-only сверка базы, проверка Production переменных уведомления без значений.
- [x] Независимое сильное ревью, устранение важных замечаний.
- [ ] Явный commit feat(analytics): report saved inquiries without QA; push, exact SHA Production success, production smoke. Обновить HOLDING_ROADMAP.md и итог проверки.

Публичный интерфейс и тексты, согласие, уведомления, антиспам и данные участков не изменяются.

Браузерная проверка localhost заблокирована Chrome; защиту не меняли. HTTP/API, CLI и остальные проверки завершены, детали в отчёте visibility.
