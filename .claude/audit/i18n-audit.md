# i18n Gap Audit — QAZNEDR.KZ

**Auditor dimension:** i18n GAP
**Date:** 2026-05-31
**Translation model:** Inline `translations` object in `src/hooks/useTranslation.ts` (1,541 lines, 4 locales ru/kz/en/zh). Files in `src/lib/translations/*.json` and `src/messages/*.json` are DEAD (zero imports) — do not migrate to them.

---

## Executive Summary

The i18n system is **structurally sound but almost entirely unused outside the homepage + footer + nav.** Of **78 components**, only **9** import `useTranslation`. Of the priority `/leads` and `/listings` internal pages, **only 2 files** (`listings/page.tsx`, `listings/[id]/page.tsx`) import the hook at all — and even those hardcode most strings while ignoring the keys that already exist.

- **95 non-test `.tsx` files** under `src/app/[locale]` + `src/components` contain Cyrillic string literals.
- **~2,134 Cyrillic lines** in non-test `.tsx` files (not all are UI strings, but the overwhelming majority on the priority pages are).
- **18 `.ts` lib files** contain Cyrillic (label maps, type unions, error messages).
- The entire **`/leads` flow** (teaser list, teaser detail, full-package page, my-leads dashboard) is **100% hardcoded RU** with **emoji icons** (📊 ⚖️ ✅) that ALSO violate the design system.
- There is **no `leads` translation namespace** — only `leadsHero` and `leadCard` exist, and the `/leads/page.tsx` doesn't even use those.

**Estimated total hardcoded UI strings needing keys: ~450–550** (excluding DATA strings from Supabase). Roughly:

- `/leads` flow: ~110 strings
- `/listings` flow + detail + filters + detail-sections: ~160 strings
- admin/dashboard: ~120 strings
- breadcrumbs/labels/error-handlers/alerts: ~80 strings

---

## CRITICAL DISTINCTION: UI strings vs DATA strings

### UI strings (fixable now via useTranslation keys)

Filter labels, sort options, breadcrumbs, section headings, badges, CTAs, empty states, form labels/placeholders, alert/error messages. These belong in the inline `translations` object.

### DATA strings (come from Supabase rows — need a label-map or export-time translation)

These cannot simply become translation keys because the _value_ is data:

- `lead.region` / `deposit.region` — RU region name stored on the row.
- `lead.teaser_title`, `lead.price_display`, `lead.grade_display`, `p.grade_full`, `p.name`, `p.raion`, `p.locality` — free-text/curated RU prose from the DB.
- `deposit.type` enum (`MINING_LICENSE`...) — enum is locale-neutral; only the LABEL needs translating.

**Good news:** `src/lib/data/filter-config.ts` (lines 12–135) ALREADY contains a complete `{ ru, kz, en, zh }` map for all 14 regions and all minerals. This is the canonical source for a `regionLabels[locale]` / `mineralLabels[locale]` helper. The enum→label maps scattered across components (TYPE_LABELS, STATUS_LABELS, subtype maps) should be consolidated into translation keys (locale-neutral enum key → translated label).

**Per the 10–40 leads/mo decision:** curated free-text DATA strings (`teaser_title`, `grade_display`, `methodology`, etc.) are best handled by **export-time / authoring-time translation** (store per-locale columns or translate at curation), NOT runtime keys. Only `region` and enum labels need the `regionLabels[locale]` map.

---

## Findings by area (file:line:string → target namespace)

### P0 — Design-system + i18n double violation: emoji in hardcoded RU on the money pages

`src/app/[locale]/leads/[code]/page.tsx` — the teaser detail page (the conversion surface) is fully hardcoded AND uses emoji icons:

- L114 `📊 Чем подтверждена ценность` → emoji + RU; should be `leadDetail.valueHeading` + Lucide icon. **(also a design P0)**
- L166 `⚖️ Все цифры — из государственного первоисточника...` → `leadDetail.sourceNote` + Lucide icon.
- L174 `✅ Юридический статус` → `leadDetail.legalStatusHeading` + Lucide icon.
- L73 `Наводки`, L91 `СВОБОДЕН`, L120 `Содержание Au`, L136 `Категории запасов`, L146 `Попутные`, L156 `Оценочная стоимость`, L206 `Расположение`, L214 `Точные координаты скрыты до доступа`, L225 `Стоимость наводки`, L236 `Продано`, L243 `Получить полные данные`, L247 `Логин → заявка → передача после соглашения`, L253 `Что входит в полный пакет`, L256–259 bullet list — ALL → new `leadDetail.*` namespace.
- L186–188 status sentences ("Свободен — проверено по координатам...") → `leadDetail.statusVerified` / `statusUnverified` / `statusUnknown`.
- L96 `TYPE_LABELS[lead.type] ?? 'Объект'` and the imported `TYPE_LABELS` (from `src/lib/leads/types.ts`) — enum label map, move to keys.

### P0 — Full-package page hardcoded RU (post-conversion deliverable)

`src/app/[locale]/leads/[code]/full/page.tsx`:

- L57 `Доступ ещё не открыт`, L60 `Полные данные по наводке`, L65 `Оставить заявку`, L72 `← Вернуться к тизеру`, L108 `Наводки`, L119 `Полный пакет`, L126 `Полный доступ`, L137 `Привязка`, L140–166 row labels (`Название`, `Варианты названия`, `Район`, `Населённый пункт`, `Координаты`, `Грейд (полный)`, `Держатель / лицензия`, `Договор`, `Первоисточник`, `Методика`, `Как выйти на точку`), L158 `Данные и источник`, L172–174 watermark notice → new `leadFull.*` namespace.
- NOTE: the _values_ (`p.name`, `p.grade_full`, etc.) are DATA strings.

### P1 — `/leads` catalog list page fully hardcoded (existing keys ignored)

`src/app/[locale]/leads/page.tsx` — does NOT import `useTranslation`:

- L64 eyebrow, L67 title, L70–72 subtitle → these DUPLICATE existing `leadsHero.*` keys (L74–83 of useTranslation.ts) — wire them up.
- L75 `Найдено:`, L91 `Фильтры`, L96 `Регион`, L103 `Все регионы`, L114 `Тип`, L121 `Все`, L122 `Россыпь (старателю)`, L123 `Инвест-объект`, L129 `Сортировка`, L136 `Сначала новые`, L137 `Дороже`, L138 `Надёжнее`, L150 `Только свободные`, L158 `Применить`, L164 `Сброс`, L175 `Ничего не найдено`, L180 `Сбросить фильтры`, L198 `← Назад`, L209 `Вперёд →` → new `leadsFilters.*` + reuse `common.*`.
- The `TIER1_PLACER/TIER2_BOMB` option labels are enum labels → keys.

### P1 — `/listings` catalog page: imports hook but hardcodes anyway

`src/app/[locale]/listings/page.tsx`:

- L134 `'Произошла ошибка при загрузке данных'` → `errors.dataLoadFailed` (EXISTS).
- L152 `'Месторождения и лицензии Казахстана'` (JSON-LD name), L154 description — DATA-ish structured-data, locale per page.
- L254 `Ошибка загрузки` → `errors.loadingError` (EXISTS), L262 `Попробовать снова` → `errors.tryAgain` (EXISTS), L291 `Выбранное месторождение`, L315 `Ничего не найдено`, L318 `Попробуйте изменить фильтры`, L321 `Сбросить фильтры`, L343 `Назад`, L388 `Далее`, L405 `Загрузка...` → `listings.loading` (EXISTS). Most map to EXISTING keys — pure wiring gap.

### P1 — Listings filter components fully hardcoded

`src/components/features/ListingsFilters.tsx` (does NOT use hook):

- L333 `placeholder="Мин"`, L343 `placeholder="Макс"`, L352 `Применить`, L366 `Регион`, L387 `Все регионы`, L426 `Полезное ископаемое`, L447 `Все минералы`, L485 `Дополнительные фильтры`, L506 `Только проверенные`, L518 `Сортировка`, L525–531 sort options (`Сначала новые`...`По популярности`), L538 `Быстрые фильтры`, L602/L612 `Фильтры`.
- L543–555 quick-filter mineral labels (`Нефть`,`Газ`,`Золото`,`Медь`) — these are DATA labels; use `mineralLabels[locale]` from filter-config.
- Most sort/region/apply strings DUPLICATE existing `listings.*` keys — wiring gap.
- `src/components/features/listings/listing-filters-sidebar.tsx` — no Cyrillic found (good, or empty).

### P1 — Listing detail page (`/listings/[id]`) — imports hook, hardcodes everything

`src/app/[locale]/listings/[id]/page.tsx` (49 Cyrillic lines):

- L31–35 type labels, L59–63 status labels (enum→key), L97/L245 `Объявление не найдено` (the P0 not-found copy from grounding facts), L106 error, L155/L161 JSON-LD breadcrumb names, L232/L405 `Загрузка...` → `listings.loading`, L297 `Главная`, L306 `Объявления`, L336 `Проверено` → `listings.verified` (EXISTS), L339 `Рекомендуем`, L355 `Просмотры`, L363 `Площадь`→`listings.area`, L371 `Ископаемое`, L379 `Регион`→`listings.region`, L390 `Описание объекта`, L411 `Местоположение`, L416 `Адрес`, L424 `Координаты`, L438 `Документы`, L453 `Скачать`, L466 `Размещено`, L469 `Обновлено`, L485 `Цена в тенге (₸)`, L495 `Написать сообщение`, L513 `В избранном`/`Сохранить`, L519 `Поделиться`, L543/L549 `Форма обратной связи`/`Обратная связь`, L561 `Имя *`, L595 `Сообщение *`, L608 `placeholder="Опишите ваш интерес..."`, L615 `Отправить`, L625–626 disclaimer, L644 `Связаться с продавцом`, L655 `Объявление` → new `listingDetail.*` namespace.
- L466/L469 `.toLocaleDateString('ru-RU')` hardcodes RU date format regardless of locale — should use `locale`-derived format.

### P1 — Detail section components (enum label maps, hardcoded)

`src/components/detail-sections/MiningLicenseDetails.tsx` (L22–25 subtypes, L34 heading, L40/L49/L59/L75 field labels), `ExplorationLicenseDetails.tsx` (L23–28 stages, L33–36 stage descriptions, L45 heading, L52/L69 labels), `MineralOccurrenceDetails.tsx` (L24–28 confidence, L33–38 access ratings, L43+ access descriptions). All enum→label maps + section headings → new `detailSections.*` namespace. None use the hook.

### P1 — Breadcrumbs fully hardcoded

`src/components/ui/Breadcrumbs.tsx` L18–56 (and duplicated L143+): `Главная`, `Объявления`, `Личный кабинет`, `Услуги`, `Компании`, `Карта`, `База знаний`, `Новости`, `Создать`, `Редактировать`, `Профиль`, `Настройки`, `Аналитика`, `Сообщения`, `Избранное`, `Мои объявления`, `Геологические услуги`, `Юридические услуги`, `Оборудование`, `Инвесторы`, `Детали` → new `breadcrumbs.*` namespace (most values already exist in `navigation`/`common`/`footer.services`).

### P1 — Admin pages hardcoded (status/type maps + UI)

`src/app/[locale]/admin/listings/page.tsx` L52–75 (filter labels, TYPE_LABELS, STATUS_LABELS), L167 confirm dialog, L192–201 access-denied block, L219–230 headings, L272 empty state, L314–422 action labels (`Одобрить`,`Отклонить`,`Снять`,`Восстановить`,`Редактировать`,`Удалить`, `просмотров`) → new `admin.*` namespace.
`src/app/[locale]/admin/users/page.tsx` L104 `alert('Не удалось обновить')`.
`src/app/[locale]/admin/lead-requests/page.tsx` L81 `alert(\`Доступ выдан. Watermark: ...\`)`.

### P1 — Dashboard pages hardcoded

`src/app/[locale]/dashboard/my-leads/page.tsx` L72 `Мои наводки`, L80 `Открытые лиды`, L86 `Мои заявки`, L96/L123 empty-state text passed as prop, L116 `Открыть пакет`, L160 `Смотреть каталог наводок →`.
`src/app/[locale]/dashboard/my-listings/page.tsx` L15–18 tab labels, L56–59 status map, L63–65 TYPE_LABELS, L151/L154/L161/L165 thrown-error strings (`Необходима авторизация`, `Ошибка загрузки`, `Произошла ошибка при загрузке`) — these surface to the user.

### P1 — Browser `alert()` with hardcoded RU (also a UX P2 — should be sonner toasts)

- `src/app/[locale]/listings/[id]/edit/page.tsx` L360 `alert('Произошла ошибка при обновлении объявления...')`.
- `src/components/features/CreateListingWizard.tsx` L914, L951, L980 — create/draft alerts hardcoded RU.
- `src/components/ui/image-upload.tsx` L118 `alert('Failed to upload images...')` — hardcoded **EN** (inconsistent locale!).
- Sonner `<Toaster>` is mounted (`src/app/[locale]/layout.tsx` L5) but the app uses native `alert()` instead of `toast()` — migrate + translate.

### P2 — Lib-level RU type/label sources (refactor targets)

- `src/lib/types/listing.ts` L4–24: `MineralType`/`RegionType` are **RU string literal unions** (`'Нефть' | 'Золото'...`, `'Мангистауская'...`). Region/mineral identity is encoded as RU text — this is why DATA strings can't be translated cleanly. Long-term: switch to locale-neutral enum keys + `filter-config.ts` label maps. (L effort, data-model change.)
- `src/lib/leads/types.ts` L66–78: `TIER_LABELS`, type labels, access labels — consolidate to keys.
- `src/lib/data/filter-config.ts` — already multilocale; promote to the single source for region/mineral labels app-wide.

---

## Missing namespaces to ADD to `useTranslation.ts` (×4 locales)

1. `leads` — catalog list page (filters, sort, pagination, empty state). ~20 keys.
2. `leadDetail` — teaser detail page. ~25 keys.
3. `leadFull` — full-package page (row labels, watermark notice). ~18 keys.
4. `listingDetail` — listing detail page (sidebar, contact form, disclaimer). ~35 keys.
5. `detailSections` — mining/exploration/occurrence enum labels + descriptions. ~30 keys.
6. `breadcrumbs` — segment labels. ~22 keys (many alias existing).
7. `admin` — moderation UI, status/type maps, action labels. ~30 keys.
8. `enumLabels` (or extend `listings`) — shared TYPE/STATUS/SUBTYPE maps used in 5+ files.

Plus helpers: `regionLabels(locale)` and `mineralLabels(locale)` reading from `filter-config.ts`; a `localeDateFormat(date, locale)` to kill hardcoded `'ru-RU'`.

---

## Effort summary

| Area                                                                                 | Effort | Note                                        |
| ------------------------------------------------------------------------------------ | ------ | ------------------------------------------- |
| Wire existing `listings`/`leadsHero`/`errors` keys into the 4 pages that ignore them | S      | pure plumbing, keys exist                   |
| Add `leads`/`leadDetail`/`leadFull` namespaces + wire `/leads/*`                     | L      | ~63 new keys ×4 locales + emoji→Lucide swap |
| Add `listingDetail` + `detailSections` + wire                                        | M      | ~65 keys ×4 locales                         |
| `breadcrumbs` + `admin` namespaces                                                   | M      | ~52 keys ×4 locales                         |
| Consolidate enum label maps → shared keys                                            | M      | touches 6+ files                            |
| `regionLabels`/`mineralLabels` helper from filter-config                             | S      | source already multilocale                  |
| Migrate `alert()`→`toast()` + translate                                              | S      | 6 call sites                                |
| Refactor RU literal-union types in `listing.ts`                                      | L      | data-model change, defer                    |
