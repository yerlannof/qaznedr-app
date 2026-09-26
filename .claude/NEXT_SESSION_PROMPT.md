# NEXT SESSION — paste this prompt verbatim

> **Шаг 1.** Открой Claude Code в директории `~/qaznedr-app` (просто `cd ~/qaznedr-app && claude` в терминале — или в UI Claude Code меню "Open folder" → `/home/yerla/qaznedr-app`).
>
> **Шаг 2.** Вставь весь блок кода ниже в новый чат и отправь.

---

```
Сначала прочитай:
1. /home/yerla/qaznedr-app/.claude/DEEP_AUDIT_PLAN.md — комплексный handoff с предыдущей сессии (текущее состояние, что построено, известные пробелы).
2. /home/yerla/qaznedr-app/CLAUDE.md — заметка к репо (есть устаревший упомин Prisma+SQLite — фактическая БД Supabase Postgres).

ЦЕЛЬ ЭТОЙ СЕССИИ — три приоритета (в этом порядке):

🥇 PRIORITY 1 — DESIGN / UX / UI на TOP уровне
Я хочу чтобы сайт qaznedr.kz выглядел и работал как премиальный продукт. Мега-удобно. На мобилке тоже идеально. Прям иконки, кнопки, hover/active состояния, микро-анимации, типографика, отступы, ритм — всё на уровне топовых fintech/luxury сайтов. Сейчас базовая основа есть (gold-on-ink hero, Cormorant Garamond, gold accents), но многие страницы внутри портала теряют этот стиль и выглядят generic.
Используй обязательно skill: frontend-design:frontend-design.
Особое внимание МОБИЛКЕ (375-414px) — это где основная аудитория.

🥈 PRIORITY 2 — ЧИСТКА мусора и бардака
В репо много легаси: mock-data (src/lib/data/mock-deposits.ts, kazakhstan-deposits.ts), dual-ORM drift (Prisma vs Supabase — оставить только Supabase), мёртвые messages/*.json (переводы инлайн в src/hooks/useTranslation.ts, файлы не используются), stale CLAUDE.md, дубли компонентов. Нужно навести порядок: удалить мёртвый код, унифицировать паттерны, обновить документацию.

🥉 PRIORITY 3 — ОСТАЛЬНОЙ аудит
SEO / accessibility / performance / security / i18n-gaps / data integrity — всё что детализировано в DEEP_AUDIT_PLAN.md секции 1.

═══════════════════════════════════════════════════════════
ИСПОЛНЕНИЕ — 4 ФАЗЫ
═══════════════════════════════════════════════════════════

Phase 1 — Plan mode (alignment).
Войди в plan mode (EnterPlanMode). На основе DEEP_AUDIT_PLAN.md и приоритетов выше задай мне 3-4 уточняющих вопроса:
  (a) Сколько лидов планирую публиковать в ближайший месяц? (это влияет на multilingual content стратегию)
  (b) Главная аудитория: старатели (мобайл-heavy) / инвесторы (десктоп) / геологи / все?
  (c) Какие страницы внутри портала самые посещаемые сейчас? (если есть аналитика — Vercel Analytics уже включён)
  (d) Бюджет токенов: согласен ли на ~1500-3000 строк tokens на параллельный аудит через 8-10 агентов + волны исполнения?
Дождись моих ответов, потом представь финальный план с конкретными «волнами улучшений» и выйди из plan mode через ExitPlanMode только после моего OK.

Phase 2 — Deep audit workflow (parallel fan-out).
ПОСЛЕ моего подтверждения плана — запусти workflow с параллельным fan-out по 10 размерностям. С УПОРОМ НА DESIGN/UX/UI И CLEANUP — это два самых "тяжёлых" агента:

  Агент 1 (HEAVY): DESIGN / UX audit — каждой страницы пройдись (главная, /leads catalog, /leads/[code] teaser, /listings catalog, /listings/[id], /admin/*, footer, navigation, 404). Скрин на desktop (1440) + mobile (375) через Playwright MCP. Оценить: typography hierarchy, spacing rhythm, hover/focus states, icon consistency, button hierarchy, dark mode coverage, animation polish, empty states. Артефакт: design-audit.md с screenshots-references + concrete fixes.
  Агент 2 (HEAVY): CLEANUP audit — найти весь мёртвый код, mock-data, duplicate components, неиспользуемые dependencies (depcheck), unused imports, dual-ORM (Prisma vs Supabase), stale docs (CLAUDE.md лжи). Артефакт: cleanup-audit.md со списком файлов на удаление/мерж.
  Агент 3: Mobile responsive audit — каждая страница на 375px viewport, выявить overflow / cut-off / нечитаемые шрифты / тач-таргеты <44px.
  Агент 4: i18n gaps — ВСЕ захардкоженные RU/EN строки во всех компонентах (особенно /leads и /listings internal pages).
  Агент 5: SEO — sitemap completeness (zh/en/kz пока закрыты), hreflang, JSON-LD per page type, meta-tags.
  Агент 6: Accessibility — keyboard nav, ARIA, contrast (gold-light на чёрном edge), reduced-motion respect.
  Агент 7: Performance — bundle size (Cormorant добавил ~30KB), Core Web Vitals, slow API calls, image optimization opportunities.
  Агент 8: Security — RLS на kazakhstan_deposits (не аудировано), rate-limit coverage, Stripe webhook validation.
  Агент 9: Code quality — TS `any` cases, hydration error #418 на /listings, дублирующиеся утилиты.
  Агент 10: Conversion / Business — friction points в основных user-flow (browse → unlock → grant), missing trust signals, FAQ gap, /about страница (нет), social proof.

Каждый агент возвращает structured JSON с findings (severity P0/P1/P2/P3 + file:line + recommended fix + estimated effort).
Сохрани все артефакты в /home/yerla/qaznedr-app/.claude/audit/.

Phase 3 — Synthesis.
Один синтез-агент агрегирует все 10 audits → ранжированный список действий с приоритетами и зависимостями. **Особо выдели DESIGN/UX findings и CLEANUP** — они должны идти в первые волны. Сохрани в /home/yerla/qaznedr-app/.claude/audit/SYNTHESIS.md в формате:
  - P0 (CRITICAL — security, broken): N штук
  - P1 (DESIGN/UX HEAVY + CLEANUP): N штук, основные
  - P2 (UX полировка, конверсия): N штук
  - P3 (nice-to-have, отложено): N штук
+ Wave-планирование: какие fixes естественно группируются.

Phase 4 — Execution Waves.
Представь мне SYNTHESIS.md. Расскажи 1-2 предложениями про каждую из 4 волн. Спроси разрешения на запуск Волны 1.
Каждая волна — отдельный workflow с агентами-исполнителями, finishing с: build + screenshot (mobile+desktop) + commit + deploy через `npx vercel --prod`.

Между волнами — короткая фиксация что сделано + что осталось + спрашивай разрешения на следующую.

═══════════════════════════════════════════════════════════
ОГРАНИЧЕНИЯ / NOTE
═══════════════════════════════════════════════════════════
- Канонический репо = /home/yerla/qaznedr-app. НЕ трогай /home/yerla/qaznedr (старая от Февраля).
- Не правь данные лидов в Supabase — они приходят из /home/yerla/projects/youtube-transcribe скриптами. Если что-то меняется в leads/lead_private — только через те скрипты.
- Используй workflow для параллельного аудита (термин "workflow" = явный opt-in).
- Используй skill frontend-design:frontend-design для дизайнерских решений — он защищает от generic AI aesthetics.
- Verify-флоу после каждого деплоя обязателен (см. DEEP_AUDIT_PLAN.md секция 3).
- Деплой только через `npx vercel --prod --yes` (CLI link уже стоит, не push-to-deploy).

Начни с Phase 1 — plan mode.
```

---

## Краткое объяснение что произойдёт

```
Phase 1 → Я задам тебе 4 вопроса (аудитория, цель, бюджет, мобильные приоритеты)
          Покажу финальный план волн
          Жду твоё OK

Phase 2 → 10 агентов параллельно ~10 минут
          Глубокий design/UX-audit (со скринами!)
          Глубокий cleanup-audit (мёртвый код, дубли)
          + 8 других измерений

Phase 3 → Синтез всех findings → SYNTHESIS.md
          P0/P1/P2/P3 приоритеты
          Группировка в волны

Phase 4 → Поочерёдные волны исполнения
          Wave 1 (P0): критическое
          Wave 2 (P1): дизайн+cleanup HEAVY
          Wave 3 (P2): полировка
          Wave 4 (P3): отложенное
          Каждая волна = build + screenshot + commit + deploy + ждать твоё OK
```

Готово.
