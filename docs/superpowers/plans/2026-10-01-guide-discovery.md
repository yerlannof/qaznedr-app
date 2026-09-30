# План — 01.10.2026

Спецификация: ../specs/2026-10-01-guide-discovery-design.md.

1. Зафиксировать исходный HEAD/origin/Production и свежий срез Google; проверить новую профильную почту без отправки.
2. Ограниченный исполнитель Sol: тесты red, минимальная реализация тематического порядка и CollectionPage/ItemList, тесты green. Явные пути: src/lib/insights/related.ts; src/lib/seo/insights-jsonld.ts; src/app/[locale]/insights/page.tsx; src/app/[locale]/insights/[slug]/page.tsx; src/__tests__/lib/insights/related.test.ts; src/__tests__/lib/seo/insights-jsonld.test.ts; src/__tests__/app/locale/insights/index.test.tsx; src/__tests__/app/locale/insights/article-toc.test.tsx. Не менять утверждённые публичные тексты/классы.
3. Ведущий читает diff, проверяет полный Jest против baseline, ESLint/format/build и реальную production-сборку на375/1440, четыре языка/две темы.
4. Независимый сильный агент читает весь diff; существенные замечания исправить red→green.
5. Явные пути commit/push master; дождаться CI и exact Production SHA success; live HTML подтверждает разметку и тематический порядок.
6. Отчёт docs/visibility/2026-10-01-guide-discovery-release.md и current status ROADMAP. Существующие локальные mail/outreach и старые черновики не включать в кодовый коммит. Новые публичные статьи остаются на утверждении после подготовки.
