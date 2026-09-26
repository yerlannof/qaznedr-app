# План: движение 08 и Douyin

1. Зафиксировать разрешение 08 и спецификацию. Сверить исходный Production.
2. Добавить падающие тесты `src/__tests__/components/features/GeologyScene.test.tsx`, SSR-интеграцию главной и паритет переводов.
3. Реализовать `GeologyScene.tsx` + CSS module, локальный спрайт в `public/brand/`, переводы четырёх языков. Заменить статичный блок в HomePageContent. Проверить red→green.
4. Отдельный агент готовит `docs/outreach/2026-09-27-douyin-launch.md`; ведущий проверяет источники и границы выводов.
5. Точечные тесты, полный Jest, ESLint, production build. Локальный браузер и просмотр снимков ведущим; исправления через тест при изменении поведения.
6. Независимый Sol review всего дифа против спецификации; исправить важное. Обновить CLAUDE.md, дизайн-статусы и HOLDING_ROADMAP.md с результатами/зависимостями.
7. Один выпуск `feat(home): add approved geological layer reveal` с явными git add путями. Push master, Production success нужного SHA, прод-проверки. Закрыть созданные вкладки/сервер, никаких TextEdit/Preview-окон для технических выгрузок.
