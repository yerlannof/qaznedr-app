# QAZNEDR — Deep Audit & Improvement Plan

**Назначение:** структурированный план глубокого аудита и поэтапного улучшения портала `qaznedr.kz`. Создан 2026-05-31 как handoff между ad-hoc-сессией и следующей plan-based + workflow-based сессией.

---

## 0. ТЕКУЩЕЕ СОСТОЯНИЕ (на конец предыдущей сессии)

- **Live:** `https://www.qaznedr.kz`, deploy через Vercel CLI (`npx vercel --prod`).
- **Master HEAD:** `467b581` (`fix(hero): clearer headline + more prominent eyebrow pill`).
- **Стек:** Next.js 15.5 / React 19 / TS, Supabase Postgres + Auth (`jiomlzyyvqpfeqyurnim`), Tailwind, MapLibre, Sentry, Stripe (заглушки), Vercel Analytics + Speed Insights.
- **Локали:** ru / kz / en / zh. Default = ru. Переводы инлайн в `src/hooks/useTranslation.ts` (а НЕ в `messages/*.json` — те mock).
- **Шрифты:** Inter (sans, `--font-inter`) + Cormorant Garamond (serif, `--font-fraunces` — имя legacy, gear-меняем).
- **Дизайн-токены:** `gold #C8A24B`, `gold-dark #A8842F`, `gold-light #E0C674`. Dark-bg `#0A0A0A`.

### Что построено в предыдущей сессии

| Компонент / Изменение                                                                                      | Файл / Деплой                                                     |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `PortalWelcomeHero` (editorial gold-on-ink, мисс., live-stats, trust-полоса, 4 локали)                     | `src/components/features/PortalWelcomeHero.tsx`, deploy `08719db` |
| `AudienceSection` (3 персоны: старатель / инвестор / геолог)                                               | `src/components/features/AudienceSection.tsx`, deploy `e5a0e20`   |
| `LeadsHomeHero` — рефакторинг под i18n                                                                     | `src/components/features/LeadsHomeHero.tsx`, `e5a0e20`            |
| `LeadCard` — 'use client' + i18n (badge/types/CTA)                                                         | `src/components/cards/LeadCard.tsx`, `a16d7c7`                    |
| `Footer` — i18n nav-колонок + копирайта                                                                    | `src/components/layouts/Footer.tsx`, `a16d7c7`                    |
| Hero clearer headline + prominent eyebrow pill                                                             | `467b581`                                                         |
| Honest legal-status (coord-verified vs registry-confirmed)                                                 | `src/app/[locale]/leads/[code]/page.tsx`, deploy `ec7c583`        |
| `/api/listings` filter `status='ACTIVE'`                                                                   | `src/app/api/listings/route.ts`, deploy `bddf66f`                 |
| Удалены дублирующий sell/invest hero + фейк-Stats Bar                                                      | `src/app/[locale]/page.tsx`, `e5a0e20`                            |
| Removed раздел: `audience.*`, `leadsHero.*`, `portal.*`, `footerNav.*`, `leadCard.*` namespaces × 4 локали | `src/hooks/useTranslation.ts`                                     |

### Что на портале сейчас (data)

- **Лиды (Supabase `leads`/`lead_private`):** 31 published, 6 DRAFT. Held: 128/170/270/307/360/374.
- **Объявления (Supabase `kazakhstan_deposits`):** 2 ACTIVE (Кудер, Найзатас), 4 DRAFT (Байгулы, Жанет, Кужал, Майкаинзолото).
- **Лиды security invariant:** PASS (аноним = 0 строк lead_private/entitlements/log).

---

## 1. ИЗВЕСТНЫЕ ОСТАВШИЕСЯ ПРОБЛЕМЫ (catalog)

Сгруппированы по природе. Каждый пункт — кандидат на отдельную таску в новой сессии.

### A. i18n — захардкоженные RU-строки

| #   | Где                                                                                                             | Что                                                                                                                                                                                 | Сложность                |
| --- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| A1  | `/zh/leads` каталог + `[code]` теasers                                                                          | Полностью рендерятся на RU (filters, breadcrumb, sections)                                                                                                                          | Средняя                  |
| A2  | `/zh/listings` (catalog + detail)                                                                               | Filter labels, mock-facets, breadcrumbs                                                                                                                                             | Средняя                  |
| A3  | `/about`, `/support`, `/legal/terms`                                                                            | Если страницы существуют — захардкожено                                                                                                                                             | Низкая (на странице)     |
| A4  | Карточка лида: **региональный чип** «Жамбылская», **title** «Золото · Жамбылская», **grade** «1 г/м³ (россыпь)» | Это уже **данные** (`region`, `teaser_title`, `grade_display`) из БД, не UI. Требует: либо мапу `regionLabels[locale]`, либо `lead_translations` таблицу, либо AI-перевод on-demand | Высокая (продукт-вопрос) |
| A5  | Все `console.error`-сообщения, тосты (`sonner`)                                                                 | Сообщения об ошибках / успехе хардкодом                                                                                                                                             | Средняя                  |
| A6  | Admin-страницы (`/admin/leads`, `/admin/lead-requests`)                                                         | Захардкожено RU; пока только Болат                                                                                                                                                  | Низкая приоритет         |
| A7  | Email-шаблоны / OG-метаданные (если есть)                                                                       | Отдельный канал i18n                                                                                                                                                                | Низкая                   |

### B. UX / Design coherence

| #   | Что                                                                                                                            | Сложность |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| B1  | Filter sidebar на `/listings` показывает mock-counters «Все типы 80 / Лицензии на добычу 45...» — реальных 2. Заменить на live | Средняя   |
| B2  | `/zh` страницы внутри портала — теряют editorial стиль hero (resort к generic Tailwind)                                        | Средняя   |
| B3  | Mobile breakpoints — не аудированы полностью (особенно hero, stats card на 375px)                                              | Средняя   |
| B4  | Dark/light theme — не везде консистентно (некоторые компоненты только light)                                                   | Средняя   |
| B5  | Empty states: `/leads` без результатов, `/listings` filtered, поиск без хитов — могут быть генериковыми                        | Низкая    |
| B6  | Typography hierarchy — Cormorant используется только в hero/AudienceSection; должна шире (заголовки страниц, цены)             | Низкая    |

### C. SEO / Discoverability

| #   | Что                                                                                                                                  | Сложность |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| C1  | `sitemap.ts` включает только RU локаль; ZH/EN/KZ закрыты от Google индекса                                                           | Низкая    |
| C2  | OG-картинки динамически не генерируются (все share — generic)                                                                        | Средняя   |
| C3  | JSON-LD: `Organization` + `WebSite` есть на главной, но `Product` для лидов работает только базово; `Place` для регионов отсутствует | Средняя   |
| C4  | hreflang теги — есть, проверить корректность для альтернативных локалей                                                              | Низкая    |
| C5  | meta-descriptions per page — много генерик                                                                                           | Средняя   |
| C6  | Schema.org разметка `BreadcrumbList`, `FAQPage`, `Service` — отсутствует                                                             | Средняя   |

### D. Performance

| #   | Что                                                                                                                      | Сложность |
| --- | ------------------------------------------------------------------------------------------------------------------------ | --------- |
| D1  | Bundle size — Cormorant Garamond добавил ~30KB. Можно `display: 'swap'` + ограничить веса до 2 (есть 4: 300/400/500/600) | Низкая    |
| D2  | Lead-cards грузятся client-side (`useEffect` + fetch) — first-paint без них; можно SSG/ISR                               | Средняя   |
| D3  | Image optimization — пока нет реальных картинок лидов/объявлений; когда появятся, `next/image` + `lqip`                  | Средняя   |
| D4  | Core Web Vitals — Speed Insights уже в проде, нужен baseline + анализ                                                    | Средняя   |
| D5  | API-роуты дёргают Supabase каждый раз — добавить in-memory cache с TTL для `/api/leads`, `/api/listings` (catalog)       | Средняя   |

### E. Accessibility (a11y)

| #   | Что                                                                                            | Сложность |
| --- | ---------------------------------------------------------------------------------------------- | --------- |
| E1  | Keyboard navigation — фокус-rings, skip-to-content, табные order                               | Средняя   |
| E2  | ARIA — снапшоты для скринридеров: PortalWelcomeHero, AudienceSection, lead card status         | Средняя   |
| E3  | Контрастность — gold-light на чёрном (~3.5:1) на edge от WCAG AA; gold-dark на белом тоже edge | Низкая    |
| E4  | Reduced motion — animations не уважают `prefers-reduced-motion`                                | Низкая    |
| E5  | Alt-tagи для иконок Lucide — все decorative, но требуют `aria-hidden` явно                     | Низкая    |

### F. Конверсия / Бизнес-логика

| #   | Что                                                                                            | Сложность                     |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------- |
| F1  | На главной нет FAQ — «А это законно? / Что за миллион?» — снимает 80% возражений               | Низкая (содержание + JSON-LD) |
| F2  | Социальное доказательство — нет (нужно 2-3 анонимных кейса)                                    | Низкая (контент)              |
| F3  | `/about` страница миссии — не существует (только редирект в footer)                            | Средняя                       |
| F4  | «Как это работает» секция на главной — generic; нужно конкретные 3 шага с скринами teaser/SALE | Средняя                       |
| F5  | Map с регионами на главной (где есть лиды) — нет                                               | Высокая (MapLibre + data)     |
| F6  | Cart/checkout flow для лидов — пока вручную через админ; нужен online-payment как Stage 4      | Высокая                       |
| F7  | Email уведомления / Telegram-bot для unlock-requests — нет (сейчас только лог в БД)            | Средняя                       |

### G. Code quality / Tech debt

| #   | Что                                                                                                      | Сложность |
| --- | -------------------------------------------------------------------------------------------------------- | --------- |
| G1  | Dual-ORM drift: Prisma (legacy mock-data, cache.ts) ↔ Supabase (real). Один путь данных, удалить Prisma | Высокая   |
| G2  | `messages/*.json` — мёртвый код, переводы инлайн в hook. Удалить файлы или переехать на них              | Низкая    |
| G3  | `src/lib/data/mock-deposits.ts` + `kazakhstan-deposits.ts` — мок-data из старого продукта. Удалить       | Низкая    |
| G4  | React hydration error #418 на `/listings` (text content mismatch)                                        | Средняя   |
| G5  | TS типы для leads — частично `any` (см. `(supabase as any)` в public-queries)                            | Средняя   |
| G6  | Тесты — нет ни юнит, ни E2E                                                                              | Высокая   |
| G7  | CI/CD — есть GitHub, нет автодеплоя; деплой через CLI                                                    | Средняя   |
| G8  | Sentry — настроен, но `tunnelRoute` и source maps уровнем выше базового — не проверено                   | Низкая    |

### H. Security

| #   | Что                                                                                                 | Сложность     |
| --- | --------------------------------------------------------------------------------------------------- | ------------- |
| H1  | RLS на лидах — проверено и работает; на `kazakhstan_deposits` — не аудировано                       | Средняя       |
| H2  | API rate-limiting — `withRateLimit` есть на `/api/leads*`, но другие роуты — нет (Upstash)          | Средняя       |
| H3  | XSS surfaces: `dangerouslySetInnerHTML` для JSON-LD (безопасно — контроль), userInput → нет места   | Низкая        |
| H4  | Stripe webhook = заглушка `console.log`. Нет валидации сигнатуры. Сейчас не критично (платёжка off) | Низкая (пока) |
| H5  | Admin auth — `requireAdmin` есть на admin API, проверить полное покрытие                            | Средняя       |
| H6  | Secret rotation — Vercel env vars и `~/.config/qaznedr/secrets.env`. Document процесс               | Низкая        |

### I. Data integrity / Operations

| #   | Что                                                                                                                | Сложность |
| --- | ------------------------------------------------------------------------------------------------------------------ | --------- |
| I1  | На `/leads` карточки — данные `region`/`teaser_title`/`grade_display` only RU. Multilingual data strategy (см. A4) | Высокая   |
| I2  | Лиды-данные обновляются вручную скриптами из `youtube-transcribe` проекта. Нет admin UI для grade calibration      | Высокая   |
| I3  | Backup / disaster recovery — Supabase автобэкап есть, но нет процедуры restore                                     | Низкая    |
| I4  | Monitoring — Sentry для ошибок, Vercel Analytics для traffic. Нет alerting на потерю функциональности              | Средняя   |

---

## 2. ПРЕДЛАГАЕМЫЙ AUDIT MODEL для новой сессии

### Phase 1 — Plan Mode (alignment)

Открыть план-режим через `/plan` или EnterPlanMode. Цель: с пользователем выровнять **приоритеты** из каталога выше. Не уходить в реализацию пока пользователь не подтвердит план через ExitPlanMode.

**Вопросы пользователю в plan mode:**

1. Какие 3 «измерения» аудита приоритетны: SEO / a11y / perf / UX / i18n / code-quality / security?
2. Сколько новых лидов планируется добавить в ближайший месяц (влияет на multilingual content strategy)?
3. Главная цель ближайшего spring: trust / SEO / mobile / conversion?
4. Окей ли тратить ~1000-2000 строк tokens на параллельный аудит через 8-10 агентов?

### Phase 2 — Audit Workflow (parallel fan-out)

Запустить **workflow** с 10 параллельными агентами, каждый аудирует одну размерность:

```
workflow({
  name: 'qaznedr-deep-audit',
  phases: [
    { title: 'Audit', detail: '10 parallel dimension audits' },
    { title: 'Synthesize', detail: 'Merge findings into ranked TODO' },
    { title: 'Plan waves', detail: 'Group findings into execution waves' },
  ]
})
```

10 audit dimensions (по одной на агента):

| #   | Размерность           | Цель                                                                            | Артефакт                            |
| --- | --------------------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | i18n                  | Найти ВСЕ захардкоженные RU/EN строки во всех компонентах                       | `i18n-gaps.json` (file:line:string) |
| 2   | SEO                   | Sitemap completeness + hreflang + JSON-LD + meta-tags audit                     | `seo-audit.md`                      |
| 3   | Performance           | Bundle analysis + Lighthouse (main pages) + slow API calls                      | `perf-audit.md`                     |
| 4   | A11y                  | axe-core dimensions (без браузера, статический) + ARIA + контраст               | `a11y-audit.md`                     |
| 5   | UX coherence          | Все страницы в режиме скрина (только заголовки): consistent?                    | `ux-audit.md`                       |
| 6   | Mobile responsive     | Все ключевые страницы на 375px viewport                                         | `mobile-audit.md`                   |
| 7   | Code quality          | Dead code (mock-deposits etc.), TS `any`, dual-ORM, unused deps                 | `code-audit.md`                     |
| 8   | Security              | RLS audit + API auth coverage + rate-limit gaps + secrets scan                  | `security-audit.md`                 |
| 9   | Business / Conversion | Friction points в основных user-flow (browse → unlock req → grant)              | `conversion-audit.md`               |
| 10  | Data integrity        | Многоязычность лидов, lead_private leak-checks повторно, mock-listings remnants | `data-audit.md`                     |

Каждый агент возвращает структурированный JSON с findings (severity HIGH/MED/LOW + file ref + recommended fix).

### Phase 3 — Synthesis

Один синтез-агент агрегирует все 10 audits → ранжированный список из ~30-60 действий по приоритету:

- **P0** (CRITICAL — security, data leak, broken)
- **P1** (HIGH — конверсия, основные user-flow)
- **P2** (MEDIUM — UX полировка, code quality)
- **P3** (LOW — nice-to-have, отложенное)

Сохраняется в `.claude/audit/SYNTHESIS.md`.

### Phase 4 — Execution Waves

Группировка по P-уровню + по зависимостям. Каждая волна = новый workflow:

**Wave 1 (P0 — критичное):**

- Закрыть security gaps (rate-limit, RLS)
- Починить hydration error
- Удалить мёртвые данные (mock-deposits, dual-ORM)

**Wave 2 (P1 — конверсия + SEO):**

- Sitemap для ZH/EN/KZ
- OG-картинки динамические
- FAQ + JSON-LD
- `/about` страница с миссией
- A4 multilingual content (regionLabels мапа минимум)

**Wave 3 (P2 — UX полировка):**

- i18n: остальные страницы (leads/listings внутренние)
- Mobile breakpoints прогон
- Dark/light coherence
- Typography hierarchy расширить

**Wave 4 (P3 — nice-to-have):**

- Карта регионов
- Тесты
- Cart/checkout

Каждая волна — отдельный workflow с агентами-исполнителями, верификацией (build + screenshot + lighthouse), коммитами.

---

## 3. ИНФРАСТРУКТУРА — что новая сессия должна знать

### Развёртывание

```bash
# в репо ~/qaznedr-app
npm run build  # локальная проверка
git add -A && git commit && git push origin master  # пушим
npx vercel --prod --yes  # деплой (CLI link уже стоит)
```

### Supabase

- `~/.config/qaznedr/secrets.env` — креды (chmod 600).
- Helper: `~/projects/youtube-transcribe/scripts/qaznedr_supabase.py` (`rest`, `run_sql`).
- Прямой SQL через Management API; data CRUD через service-role REST.

### Структура translations (КРИТИЧНО)

Переводы **в `src/hooks/useTranslation.ts`** инлайн (4 локали в одном объекте `translations`). Файлы `messages/*.json` существуют, но **не используются** (legacy/mock).

Добавить новый namespace = редактировать ОДИН файл (`useTranslation.ts`) в 4 местах (по локали). Python-script для batch-инжекта — см. примеры в git history (`5fa0e20`, `a16d7c7`).

### Архитектура лидов

- `leads` (public, RLS published) — тизеры
- `lead_private` (RLS DENY-ALL) — приватка (читает только service-role после entitlement)
- `lead_entitlements` (кто получил доступ + watermark_token)
- `lead_unlock_requests` (воронка интереса)
- `lead_access_log` (трассировка)

### Лиды-данные обновляются ИЗ другого репозитория

Скрипты в `~/projects/youtube-transcribe/scripts/`:

- `export_leads_to_portal.py` — push реестра → Supabase
- `apply_tierb_calibration.py` — калибровка грейдов
- `scan_live_leads_leak.py` — leak-scan
- `verify_leads_security.py` — RLS invariant check

### Verify-флоу для нового деплоя

```bash
# смок после деплоя
curl -s https://www.qaznedr.kz/api/leads?limit=1 | head -c 200
curl -s https://www.qaznedr.kz/api/listings?limit=1 | head -c 200
# RLS invariant
.venv/bin/python ~/projects/youtube-transcribe/scripts/verify_leads_security.py
```

---

## 4. КАК НАЧАТЬ НОВУЮ СЕССИЮ

См. `.claude/NEXT_SESSION_PROMPT.md` — там готовая «paste-ready» инструкция, которую вставляешь в новый чат.

Открыть Claude Code в директории `~/qaznedr-app`, и вставить весь промпт из `.claude/NEXT_SESSION_PROMPT.md`.

---

_Создано: 2026-05-31. Источник: ad-hoc сессия из `~/projects/youtube-transcribe`, deploys `08719db`..`467b581`._
