# QAZNEDR Audit — Wave Execution Progress

Tracks what's shipped vs remaining against `.claude/audit/SYNTHESIS.md`. Updated as waves deploy.

## ✅ Wave 1 — Funnel + premium design (DEPLOYED, commits 3fa7218..988ecb0)

- P0-1 listing detail Prisma→Supabase (shared `src/lib/listings/transform.ts` + `listing-status.ts`)
- P0-2 locale-prefixed card links; P0-4 action button out of `<Link>`
- P0-3 hydration #418 fixed (root cause was `Math.random()` in `ListingsFilters` fake counts — removed)
- P0-5 branded localized 404; P0-6 RLS `status='ACTIVE'` (anon DRAFT leak closed); P0-7 errors/analytics GET requireAdmin; P0-8 zoom restored
- P1-1..6 editorial gold/serif on `/leads`,`/listings`,teaser,cards (`BaseListingCard`); P1-11 emoji→Lucide; P2-15..18 UI primitives
- P3-1 safe deletes (~1.3k lines). themeColor→viewport.

## ✅ Wave 2 — Conversion + SEO + trust pages (DEPLOYED)

- P2-7/8 `/about` `/support` `/legal/terms` `/faq` (FAQPage JSON-LD)
- P2-6/10/11/12/13/14 teaser legality block, fixed-price package, CTA copy, unlock next-step, catalog value prop + capture
- P1-18(partial)/19/20/21, P2-19/20: sitemap all-locale + new routes, hreflang/canonical, robots locale-prefix, services metadata, llms.txt, Product offers fix
- P1-14 `regionLabel`/`mineralLabel` helpers in `filter-config.ts`

## ✅ Wave 3a — a11y + perf + cleanup + polish (DEPLOYED)

- P1-23/24/25 skip link + `<main id=main>` + nav/menu/toggle ARIA + 44px targets + aria-current
- P2-23 global prefers-reduced-motion; P1-30 Cormorant trimmed to 3 normal weights
- P3-9/10 PortalWelcomeHero design-law fixes (Sparkles→Gem, no ping/glow, reduced-motion)
- P1-31 60s in-process TTL cache on `/api/listings` + `/api/leads`
- P3-2 mock-deposits fallback removed + `mock-deposits.ts` deleted
- Fixed the double brand suffix in the 4 new page titles

## ✅ Wave 3a-polish — light fixes (DEPLOYED)

- P3-11 ThemeToggle added to navbar; P3-12 map/list view-toggle on-brand (black active + gold ring)
- P1-28 (partial) contrast: gray-400→gray-500 readable text, #0A84FF link text→#0060DF
- P2-21 aria-hidden on decorative card icons; detail error/loading states off blue→black/gold

## ✅ Wave 3b (part 1) — i18n internal pages (DEPLOYED)

- P1-12/13/15: localized catalogs, ListingsFilters, Breadcrumbs, teaser conversion strings (en/zh/kz), RU unchanged, 0 raw-key leakage
- Architecture: translations extracted to `src/lib/i18n/translations.ts` (server-safe) + `getServerTranslation` for RSC; `useTranslation` now a thin client hook
- Namespaces added ×4 locales: `breadcrumbs`, `listingsFilters`, `leadsCatalog`, `leadDetail` (+ extended `listings`)

## ✅ Security + a11y hardening (DEPLOYED, verified in prod)

- P2-4 indexnow POST guarded (admin/secret + rate limit); metrics GET deny-by-default (prod returns 401)
- P2-3 JSON-LD `<`-escaped on home/services/listings (others already done); errors/analytics POST rate-limited; P2-5 Stripe HMAC not reversible base64
- P1-26/27 form labels (unlock + contact), aria-pressed on favorite, breadcrumb nav[aria-label]+aria-current, decorative icons aria-hidden
- Docs: CLAUDE.md corrected (Supabase/Next 15.5/gold-serif/4-locale)

## ✅ P1-29 `/listings` → server component (DEPLOYED)

- Now `async` RSC: `getListings()` in `src/lib/listings/queries.ts` fetches Supabase server-side; cards SSR'd into raw HTML (verified in prod — was blank), real count SSR'd, pagination = server `<Link>`s, view-toggle/map in `ListingsResults` client island. No hydration error.
- Also fixed: catalog sort dropdown now works (`?sort=price_desc` etc. → column/ascending in getListings; was silently ignored).

## ⏳ REMAINING (heavy — needs SCHEMA DECISIONS, not blind coding)

- **P3-3/4 Prisma→Supabase migration** — BLOCKED on net-new schema. Supabase public tables are ONLY: kazakhstan_deposits, leads, lead_private, lead_entitlements, lead_unlock_requests, lead_access_log, contact_views, profiles, services. The Prisma routes (favorites, errors, analytics, health, views, GDPR, audit-logger) write to tables that DON'T EXIST in Supabase (no favorites/error_logs/analytics_events/views/user tables). Migrating = DESIGN + CREATE those tables with correct RLS first (a product/security decision), then swap the client. Do NOT do this autonomously — involve the user on which features to keep + RLS. Until then errors/analytics/favorites silently fail in prod (write to empty SQLite). Then drop @prisma/client + P3-5 next-intl unwire (then `src/messages/*.json` deletable).
- P1-16/17 admin/dashboard i18n + alert()→toast (lower priority); P1-28 finish contrast site-wide
- P2-24 ISR on catalogs; recharts lazy-load (typed wrapper); P2-15 `EmptyState`/`Pagination`; P3-7/8 de-`any` + console sweep; tests; P2-1 rate-limit fail-closed (ONLY after confirming Upstash configured in prod — else it takes prod down)

## ⏳ Wave 4 — Heavy/deferred (not started)

- P3-3/4 full Prisma→Supabase migration (favorites, auth/register, health, analytics/metrics/errors, GDPR, audit-logger, backup) then drop @prisma/client
- P3-5 next-intl unwire (then `src/messages/*.json` can be deleted — NOT before)
- P2-1/2/3/4/5 security hardening: rate-limit fail-closed, auth model docs, JSON-LD `<`-escape (done on listing detail), metrics/indexnow guards, Stripe metadata
- P3-7/8 de-`any` money path, console.\* sweep + ESLint no-console; P2-26 handleApiError adoption; tests; CLAUDE.md/llms.txt refresh
