# План 7б — Search readiness

1. Проверить sync и production; сохранить фактические результаты GSC/Bing и обхода.
2. Написать падающие тесты root redirect (`src/__tests__/middleware.test.ts`,
   fallback root) и полноты sitemap (`src/__tests__/app/robots-sitemap.test.ts`).
3. Исправить middleware/root/Vercel и sitemap; добавить модуль проверенного снимка
   в `src/lib/seo/sitemap-leads.ts`. Полный снимок кэшируется, ошибки выбрасываются.
   Отдельная узкая задача Luna: TDD и CollectionPage/ItemList каталога в
   `src/app/[locale]/leads/page.tsx`, только реально показанные карточки.
   Вывести из эксплуатации старый ложноположительный sitemap-ping script;
   TDD `src/__tests__/scripts/ping-search-engines.test.ts`, без сети.
4. Прогнать точечные/полные тесты, ESLint и build. Проверить production-сборку:
   root/query, XML, все языки в 375/1440 light/dark; визуальных правок нет.
5. Проверить GSC live URL, Bing AI Performance/sitemap; выполнить доступный переобход.
   Записать отчёт `docs/visibility/2026-09-27-search-readiness.md` и блокеры Китая.
6. Независимое ревью Sol против спецификации; исправить важное через тесты.
7. Обновить roadmap, коммит явными путями `fix(seo): harden crawl entry and sitemap snapshots`,
   push master, дождаться success; сверить три SHA и проверить production.
8. Закрывающий docs-коммит с результатами, push и окончательная сверка.
