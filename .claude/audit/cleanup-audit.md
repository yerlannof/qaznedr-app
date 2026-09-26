# HEAVY CLEANUP AUDIT — qaznedr-app

Method: every kill-list candidate was grep-proven for import count before recommendation.
All paths absolute-relative to `/home/yerla/qaznedr-app`. Read-only analysis; no builds run.

Legend: **safe-to-delete** = zero importers, no fix needed · **needs-fix** = one importer that must be rerouted first · **migration** = load-bearing, requires a scoped ORM/data migration.

---

## CORRECTION TO GROUNDING FACTS (must propagate)

The grounding fact says: _"The files src/lib/translations/_.json and src/messages/_.json are DEAD (zero imports)."_

**This is HALF WRONG.** `src/messages/*.json` is **LIVE**:

- `i18n.ts:6` → `messages: (await import(\`./src/messages/${locale || 'ru'}.json\`)).default`
- `next.config.ts:5` → `createNextIntlPlugin('./i18n.ts')` wires that config into the build.

So next-intl's `useTranslations()`/server `getTranslations()` load **`src/messages/*.json`** at runtime. Deleting them breaks any component using next-intl's API.

What IS dead:

- **`src/lib/translations/*.json`** — zero imports anywhere. (DEAD)
- **`i18n/request.js` + `i18n/routing.ts`** — zero references; the active config is the top-level `i18n.ts`, not the `i18n/` directory. (DEAD)

Net: the app has **TWO parallel i18n systems** — (a) inline `src/hooks/useTranslation.ts` (1,541 lines, 37 consumers) and (b) next-intl reading `src/messages/*.json`. Both are live. The dead leftovers are `src/lib/translations/*.json` and the `i18n/` directory.

---

## 1) MOCK / LEGACY DATA FILES (src/lib/data/)

| File                                  | Lines | Importers                                                                                                                                          | Safe?                                                                           | Blocking fix                                      |
| ------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/data/kazakhstan-deposits.ts` | 528   | **0** (grep `import.*kazakhstan-deposits` → none)                                                                                                  | **safe-to-delete**                                                              | none                                              |
| `src/lib/data/mock-listings.ts`       | 134   | **1, indirect**: re-exported by `src/lib/data/index.ts:1`. `index.ts` itself has **0 consumers**. The named `mockListings` export is used nowhere. | **safe-to-delete** (delete both `mock-listings.ts` AND `src/lib/data/index.ts`) | none                                              |
| `src/lib/data/index.ts`               | ~1    | **0** (`grep "from '@/lib/data'"` → none)                                                                                                          | **safe-to-delete**                                                              | none                                              |
| `src/lib/data/mock-deposits.ts`       | 232   | **1, LIVE**: `src/app/api/listings/route.ts:4` `import { mockDeposits }`                                                                           | **needs-fix**                                                                   | Used as a FALLBACK at `route.ts:337` — `if (error |     | deposits.length === 0) { let filteredMocks = [...mockDeposits]; }`. Now that Supabase has real ACTIVE listings, this fallback masks DB failures (returns fake data instead of an error). **Fix:** remove the fallback block (route.ts ~lines 331–end of fallback), return empty/`[]`+ proper error, then delete`mock-deposits.ts`. Effort M (must re-read the route to scope the exact block). |

Total reclaimable here once route is fixed: ~894 lines.

---

## 2) ORPHANED CACHE MODULES

| File                                   | Lines | Importers                                                                                                                           | Safe?                             |
| -------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `src/lib/cache.ts`                     | 241   | **0** (`grep "from '@/lib/cache'"` excluding `lib/cache/` → none). NOTE: it itself imports prisma (10 refs) but nothing imports it. | **safe-to-delete**                |
| `src/lib/utils/cache.ts`               | 333   | **0** (`grep "utils/cache'"` → none)                                                                                                | **safe-to-delete**                |
| `src/lib/cache/redis-cache-service.ts` | 493   | **4 LIVE**: transaction-manager, data-consistency-middleware, search-service, cache-middleware                                      | **KEEP — this is the live cache** |

Reclaimable: 574 lines (two orphans). The live cache is `redis-cache-service.ts`; do not touch it.

---

## 3) DEAD TRANSLATION JSON & i18n LEFTOVERS

| Path                                                                              | Importers                                                                                                   | Safe?                    |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------ |
| `src/lib/translations/en.json` / `kz.json` / `ru.json` / `zh.json` (~17 KB total) | **0** (`grep "lib/translations"` → none)                                                                    | **safe-to-delete**       |
| `i18n/request.js`                                                                 | **0** (next.config points to `./i18n.ts`, not this)                                                         | **safe-to-delete**       |
| `i18n/routing.ts`                                                                 | **0** (`grep "i18n/routing"` repo-wide → none; middleware.ts has its own inline `locales` array at line 56) | **safe-to-delete**       |
| `src/messages/*.json`                                                             | **LIVE** via `i18n.ts:6`                                                                                    | **KEEP — do NOT delete** |

Caveat for executor: before deleting `i18n/`, double-check `tsconfig.json` `paths` and any `next-intl` plugin arg. Verified `next.config.ts:5` uses `'./i18n.ts'` — the `i18n/` dir is unreferenced.

---

## 4) DUPLICATE COMPONENTS / _New / _.complex VARIANTS

| File                                                                        | Lines        | Importers                                                                                                                                                                                                     | Safe?                                                                                                                                                                                                        |
| --------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/[locale]/listings/create/page.complex.tsx`                         | 62           | **0** (`grep "page.complex"` → none). Next.js App Router only routes `page.tsx`; `.complex.` suffix is inert.                                                                                                 | **safe-to-delete**                                                                                                                                                                                           |
| `src/components/ErrorBoundary.tsx` vs `src/components/ui/ErrorBoundary.tsx` | dup basename | `components/ErrorBoundary.tsx` is re-exported by `src/components/index.ts:8-11` (barrel). That barrel (`@/components`) has **0 consumers**. `ui/ErrorBoundary.tsx` IS imported (appears in depcheck "using"). | **`src/components/index.ts` barrel = safe-to-delete; root `components/ErrorBoundary.tsx` = needs-fix (verify no default-import usage, then delete with the barrel). Keep `ui/ErrorBoundary.tsx`.** Effort S. |

No other `*New.tsx` / `*.old.*` / `*.bak` files exist (find returned only `page.complex.tsx`).

---

## 5) DUPLICATE RATE-LIMIT MIDDLEWARES — BOTH LIVE (consolidation, not deletion)

| File                                  | Lines          | Exports                        | Routes using it                                                                                                                                                    |
| ------------------------------------- | -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/middleware/rate-limit.ts`    | ~90 (3.4 KB)   | `rateLimit`, `verifyRateLimit` | `api/listings/route.ts`, `api/search/autocomplete`, `api/search/advanced`, `api/search/similar`, `api/gdpr/export`, `api/gdpr/delete`, `api/gdpr/consent` (+ test) |
| `src/lib/middleware/rate-limiting.ts` | ~360 (13.5 KB) | `withRateLimit`                | `api/leads/[code]/route.ts`, `api/leads/route.ts`, `api/leads/[code]/request`, `api/admin/observability`, `api/admin/transactions`, `api/payments/create-intent`   |

**Neither is deletable as-is** — they serve disjoint route sets with different APIs (`verifyRateLimit`/`rateLimit` vs `withRateLimit`). This is genuine duplication of a security primitive (two independent token buckets, inconsistent limits). **Recommendation:** consolidate onto the richer `rate-limiting.ts` (`withRateLimit`), port the ~9 `rate-limit.ts` call-sites, update `src/lib/middleware/__tests__/rate-limit.test.ts`, then delete `rate-limit.ts`. Effort **L** (security-sensitive, touches GDPR + search + listings routes). Until then, KEEP both.

---

## 6) DUAL-ORM: PRISMA ↔ SUPABASE

`src/lib/prisma.ts` (the client, `getPrisma()`) is imported by **14 files**. Supabase is imported by **56 files** and is the system of record (all admin, leads, listings catalog, auth, payments, GDPR data flows). Prisma points at **SQLite** (`prisma/schema.prisma:9-10` `provider = "sqlite"`, `url = env("DATABASE_URL")`) — a different datastore than the production Supabase Postgres. This is the root of the **P0 listing-detail bug**: catalog reads Supabase (real rows), detail reads Prisma/SQLite (empty) → "Объявление не найдено".

### Every Prisma importer, classified

| File                                        | `prisma.` refs                                                             | Class                           | Notes / migration                                                                                                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/listings/[id]/route.ts`        | 8                                                                          | **load-bearing — P0 BLOCKER**   | Detail endpoint reads Prisma → empty. Migrate to Supabase (catalog `route.ts` already shows the `transformDepositFromDB` + `supabase.from('listings')` pattern to copy). **Migrate FIRST.** Effort M. |
| `src/app/[locale]/listings/[id]/layout.tsx` | 1                                                                          | **load-bearing — P0 BLOCKER**   | `generateMetadata` reads Prisma for title/desc → wrong/empty SEO on every detail page. Migrate alongside the route above. Effort S.                                                                   |
| `src/app/api/favorites/route.ts`            | 7                                                                          | **load-bearing**                | Favorites persisted to SQLite, divorced from Supabase users. Migrate to a Supabase `favorites` table (or confirm one exists). Effort M.                                                               |
| `src/app/api/auth/register/route.ts`        | 2                                                                          | **load-bearing (dual-write)**   | Imports BOTH prisma and supabase. Registration writes to two stores — drift risk. Drop Prisma write, keep Supabase Auth. Effort M.                                                                    |
| `src/app/api/health/route.ts`               | 2                                                                          | **easily-migratable**           | Health-checks Prisma connectivity to a DB nothing else trusts; reports false health. Swap to a Supabase `select 1`. Effort S.                                                                         |
| `src/app/api/analytics/route.ts`            | 4                                                                          | **easily-migratable**           | Reads counts from empty SQLite → analytics show 0. Repoint to Supabase or stub. Effort M.                                                                                                             |
| `src/app/api/metrics/route.ts`              | 5                                                                          | **easily-migratable**           | Same empty-DB metrics problem. Effort M.                                                                                                                                                              |
| `src/app/api/errors/route.ts`               | 6                                                                          | **easily-migratable**           | Error log sink in SQLite; low value, can move to Supabase table or Sentry-only. Effort M.                                                                                                             |
| `src/lib/compliance/gdpr-compliance.ts`     | 17                                                                         | **load-bearing (compliance)**   | GDPR export/delete operates on Prisma/SQLite — **legally wrong**, user PII lives in Supabase. Consumed by `api/gdpr/route.ts` + `compliance-middleware.ts`. High-priority migration. Effort L.        |
| `src/lib/compliance/audit-logger.ts`        | 3                                                                          | **load-bearing (compliance)**   | Audit trail to SQLite (lost/ephemeral). Consumed by gdpr, backup, performance-optimizer, compliance-middleware. Migrate to Supabase audit table. Effort M.                                            |
| `src/lib/database/performance-optimizer.ts` | 4                                                                          | **load-bearing-ish**            | Consumed by `api/database/performance/route.ts`. Prisma-specific query analysis — may be deletable if that admin route is unused; verify. Effort M.                                                   |
| `src/lib/backup/backup-manager.ts`          | 741L, `getPrisma()` via `this.prisma` (0 direct `prisma.` but uses client) | **load-bearing-ish**            | Consumed by `api/backup/route.ts`. Backs up SQLite (the empty DB) — near-useless. Candidate for delete-or-migrate. Effort L.                                                                          |
| `src/lib/cache.ts`                          | 10                                                                         | **DEAD** (see §2 — 0 importers) | Delete outright; ignore its Prisma refs.                                                                                                                                                              |
| `src/lib/utils/error-handler.ts`            | 0 direct `prisma.` (imports module for typed error handling)               | **easily-migratable**           | Only catches `Prisma.PrismaClientKnownRequestError`. Once Prisma is gone, drop the Prisma-specific branch. Effort S.                                                                                  |

### Recommended migration order

1. **`api/listings/[id]/route.ts` + `[id]/layout.tsx`** → kills the P0 not-found bug. (M)
2. **`api/health/route.ts`** → stop false-green health. (S)
3. **`api/favorites/route.ts`** → user-facing. (M)
4. **`api/auth/register/route.ts`** → stop dual-write drift. (M)
5. **compliance: `gdpr-compliance.ts` + `audit-logger.ts`** → legal correctness. (L)
6. **analytics/metrics/errors** routes → data correctness. (M each)
7. **backup-manager / performance-optimizer** → evaluate delete-vs-migrate. (L)
8. Delete `src/lib/cache.ts` (dead, §2).
9. After last Prisma importer is gone: remove `@prisma/client` + `prisma` deps, `prisma/` dir, `prisma generate` from `build` script (`package.json:7`), `DATABASE_URL`. (M)

This is a **scoped migration, NOT a delete** (per grounding caveat). ~14 files; sequence above is dependency-safe (compliance helpers migrate before/with their routes).

---

## 7) UNUSED DEPENDENCIES (depcheck, false-positives filtered)

Raw depcheck → unused deps: `["nuqs"]`; unused devDeps: `["autoprefixer","jest-environment-jsdom","postcss"]`.

| Package                  | Verdict                   | Evidence                                                                          |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------- |
| `nuqs`                   | **TRULY UNUSED — remove** | repo-wide `grep nuqs` (excluding node_modules/lock) → **0 hits**. Safe. Effort S. |
| `autoprefixer`           | **FALSE POSITIVE — keep** | Used by `postcss.config.mjs` (PostCSS plugin chain, not import-detectable).       |
| `postcss`                | **FALSE POSITIVE — keep** | Tailwind/Next build dependency; `postcss.config.mjs` present.                     |
| `jest-environment-jsdom` | **FALSE POSITIVE — keep** | Referenced by `jest.config.ts` testEnvironment (string, not import).              |

depcheck "missing" (informational, not cleanup): `@next/env` (jest.setup.js), `next-pwa` (next.config.pwa.js — note: `next.config.pwa.js` is itself unreferenced/dead config since active config is `next.config.ts`), `chalk` (scripts/database-migration.ts), `@cloudflare/kv-asset-handler` (.cloudflare/worker.js). These are in non-built helper/script files; verify whether `next.config.pwa.js`, `.cloudflare/worker.js`, and `scripts/database-migration.ts` are still used before adding deps — likely **stale build artifacts** themselves.

**Net dependency action:** remove `nuqs` only.

### Likely-dead config/script files (verify, then delete)

- `next.config.pwa.js` — active config is `next.config.ts`; this is an unused alternate. (verify)
- `.cloudflare/worker.js` — if not deploying to CF Workers. (verify)
- `scripts/database-migration.ts` — Prisma-era migration script; obsolete after ORM migration. (verify)

---

## 8) STALE DOCS — CLAUDE.md claims that contradict reality

`/home/yerla/qaznedr-app/CLAUDE.md`:

| Line                         | Claim                                                                                                   | Reality                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 40                           | "**Database**: Prisma with SQLite"                                                                      | Production DB is **Supabase Postgres**. Prisma/SQLite is a vestigial second ORM behind the P0 bug. **WRONG / dangerous** — drives devs to the wrong datastore.                                                                                                                          |
| 7 (Tech Stack header region) | "Next.js 15.3.4"                                                                                        | Repo is **Next.js 15.5** (per task grounding). Stale version.                                                                                                                                                                                                                           |
| 43                           | "State Management: React Context (Favorites, **i18n**, Theme)"                                          | i18n is now primarily the inline `src/hooks/useTranslation.ts` hook (37 consumers) + next-intl on `src/messages/*.json`. The `i18n-context.tsx` exists but is only referenced by `contexts/index.ts` barrel + 1 test — effectively sidelined. Misleading.                               |
| 184–186                      | "Known Issues: i18n Configuration Error … Messages path must be `./src/messages/${locale}.json`"        | This part is actually still TRUE (`i18n.ts:6`) — keep.                                                                                                                                                                                                                                  |
| 258–290                      | "Active MCP Servers" / "16 активных" (global CLAUDE.md) lists Sentry/Cloudflare/GitLab/Jira-Linear etc. | Environment advertises a **different** MCP set; the 16-server list and "Jira/Linear task" workflows are aspirational/unverified. Mark as illustrative, not authoritative.                                                                                                               |
| MCP section                  | "MCP Configuration Location: `~/.claude.json` under `/Users/yerlankulumgariyev/Documents/qaznedr-app`"  | Path is a **macOS path**; this environment is Linux/WSL at `/home/yerla/qaznedr-app`. Stale machine-specific doc.                                                                                                                                                                       |
| Design System section        | "Colors: Gray base + blue accent #0A84FF … Primary buttons are BLACK"                                   | Actual live design system is **gold #C8A24B / serif Cormorant / ink #0A0A0A** (homepage editorial). The gray+blue spec describes an older design. Partially stale — blue #0A84FF still a token, but the documented "no gradients/gray base" no longer matches the gold-on-ink homepage. |
| Performance section          | "Removed \*New suffix variants"                                                                         | Mostly true (no `*New` files remain) but `page.complex.tsx` and dual ErrorBoundary survive. Minor.                                                                                                                                                                                      |

**Fix:** rewrite CLAUDE.md Tech Stack + Database + State Management + Design System sections to match Supabase Postgres / Next 15.5 / gold-ink design / dual-i18n reality. Effort M.

---

## SUMMARY KILL-LIST (zero-fix deletions — do these first)

Proven 0 importers, delete immediately (~1,748 lines + 4 JSON):

- `src/lib/data/kazakhstan-deposits.ts` (528)
- `src/lib/data/mock-listings.ts` (134) + `src/lib/data/index.ts` (1)
- `src/lib/cache.ts` (241)
- `src/lib/utils/cache.ts` (333)
- `src/lib/translations/{en,kz,ru,zh}.json` (~17 KB)
- `i18n/request.js` + `i18n/routing.ts`
- `src/app/[locale]/listings/create/page.complex.tsx` (62)
- `src/components/index.ts` barrel + (after default-import check) `src/components/ErrorBoundary.tsx`
- dep: `nuqs`

Needs-fix-then-delete:

- `src/lib/data/mock-deposits.ts` (232) — remove fallback in `api/listings/route.ts` first.

Migration (scoped, NOT delete): 14 Prisma files per §6 order — fix listing-detail P0 first.

DO NOT DELETE (corrections vs grounding): `src/messages/*.json` (live next-intl source), `src/lib/cache/redis-cache-service.ts`, both rate-limit middlewares (consolidate, don't delete).
