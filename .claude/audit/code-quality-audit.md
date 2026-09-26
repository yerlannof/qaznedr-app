# Code Quality / Tech-Debt Audit — QAZNEDR.KZ

Scope: hydration error on /listings, broken listing detail (dual-ORM drift), TS `any` usage, themeColor metadata warning, error-handling consistency, console.\* in production. Static read-only analysis. No builds run, no files modified except this artifact.

---

## 1. CONFIRMED P0 — Listing detail "Объявление не найдено" for a valid Supabase id

### Root cause (two stacked bugs)

**Bug A — Dual-ORM drift (primary cause of the 404).**

- Catalog `/api/listings` (`src/app/api/listings/route.ts:254`) reads from **Supabase** (`createClient()` → `supabase.from('kazakhstan_deposits')`). This is where the 2 real ACTIVE listings (Кудер, Найзатас) live.
- Detail `/api/listings/[id]` (`src/app/api/listings/[id]/route.ts:13-17`) reads from **Prisma** (`getPrisma()` → `prisma.kazakhstanDeposit.findUnique`). Prisma points at the (empty/legacy SQLite-era) datasource, so `findUnique` returns `null` → route returns `404` (`route.ts:49-54`) → client `depositApi.getById` returns `null` (`src/lib/api/deposits.ts:86-90`) → detail page sets `error = 'Объявление не найдено'` (`src/app/[locale]/listings/[id]/page.tsx:96-98`).

So a card linked from the catalog (Supabase id) is queried against Prisma (no such row) → guaranteed not-found for every real listing. The detail page can NEVER resolve a real listing while the two routes use different data stores.

**Bug B — Shape mismatch (would break rendering even after Bug A is fixed).**
The detail page expects a camelCase `KazakhstanDeposit` (`src/lib/types/listing.ts`): `userId`, `contactName`, `contactPhone`, `contactEmail`, `coordinates: [number, number]`, `createdAt: Date`, `documents: string[]`. The Prisma route returns a raw spread `...deposit` (`route.ts:85-92`) where:

- `coordinates`/`images`/`documents` are `JSON.parse`'d (OK-ish),
- but `userId`/`contactName`/`contactPhone`/`contactEmail` are NOT mapped (they live under the included `user` relation, not on the row), so `ContactReveal` (`page.tsx:528-534`) gets `undefined` props,
- `createdAt`/`updatedAt` arrive as JSON strings, then `page.tsx:466-469` calls `.toLocaleDateString()` on a string → runtime `TypeError` (string has no `.toLocaleDateString`). The page already does `new Date(...)` in cards but NOT here.

### Fix (effort: M)

Make the detail route read from Supabase and return the SAME camelCase shape the catalog uses. Concretely:

- Rewrite `src/app/api/listings/[id]/route.ts` GET to `createClient()` → `supabase.from('kazakhstan_deposits').select('*').eq('id', id).single()`, then run it through the existing `transformDepositFromDB(row)` helper that `route.ts` (catalog) already has (`src/app/api/listings/route.ts:35-142`). Extract that helper into `src/lib/listings/transform.ts` and import it in both routes (removes duplication, see §6).
- Move the view-increment (`route.ts:57-83`) to a Supabase `update` / RPC, or drop it for now (it currently writes to Prisma `View` table that the rest of the app doesn't read).
- PUT/DELETE in the same file are also Prisma-based (`route.ts:107,220`) and have the same drift — migrate or they will silently fail for Supabase-owned listings. At minimum, gate them so they don't 500 on real ids.
- Belt-and-suspenders: add `src/app/[locale]/listings/[id]/page.tsx` date guard — wrap `deposit.createdAt` in `new Date(...)` before `.toLocaleDateString` (lines 466, 469).

---

## 2. CONFIRMED P0 — React hydration error #418 on /listings

### Root cause: `Number.prototype.toLocaleString()` called with NO locale argument

The three listing cards render area with a locale-less `toLocaleString()`:

- `src/components/cards/MiningLicenseCard.tsx:91` — `{deposit.area.toLocaleString()} км²`
- `src/components/cards/ExplorationLicenseCard.tsx:87` — same
- `src/components/cards/MineralOccurrenceCard.tsx:87` — same

With no locale arg, `toLocaleString()` uses the runtime's default locale. On the Node server this is typically `en-US` (`12,500`); in the user's browser it resolves to Russian (`12 500` with U+00A0 non-breaking space). The server-rendered HTML text ≠ client-rendered text → React #418 "server rendered text didn't match client". This is the exact mismatch confirmed in the session.

(Note: `formatPrice` in `src/lib/utils/format.ts:9-21` is already hydration-safe — explicit `'ru-RU'` + `.replace(/ /g, ' ')`. The dates in the cards use explicit `'ru-RU'` so they are NOT the culprit. Only the bare `area.toLocaleString()` is.)

### Fix (effort: S)

Replace the three bare `deposit.area.toLocaleString()` with the existing `formatArea(deposit.area)` helper (`src/lib/utils/format.ts:81-86`, which already pins `'ru-RU'` and strips NBSP). Drop the trailing ` км²` literal since `formatArea` appends it. This makes server and client byte-identical.

### Secondary `toLocaleString()` (no-locale) offenders — same latent bug class (effort: S each)

- `src/lib/utils/format.ts:74` — `formatPriceWithCurrency` else-branch `convertedPrice.toLocaleString()`
- `src/lib/utils/format.ts:342` — `formatReserves` else-branch `amount.toLocaleString()`
- `src/app/[locale]/listings/[id]/page.tsx:267` — `formatPrice` local copy uses `price.toLocaleString()` (and duplicates the util — see §6)
- `src/app/[locale]/listings/[id]/page.tsx:358,366` — `deposit.views`, `deposit.area.toLocaleString()` in detail page
  Pin all to `'ru-RU'` (or locale-aware) and strip NBSP, or route them through `format.ts`.

---

## 3. P0/P1 — `themeColor` in `metadata` export (Next.js 15 warning)

### Location

`src/app/layout.tsx:8-11` — `themeColor` lives inside `export const metadata`. Next.js 15 moved `themeColor`, `colorScheme`, and `viewport` out of `metadata` into a separate `viewport` export; keeping it in `metadata` emits the "Unsupported metadata themeColor in metadata export" warning on `/[locale]` and `/[locale]/listings`.

### Fix (effort: S)

In `src/app/layout.tsx`, remove the `themeColor: [...]` block from `metadata` and add:

```ts
import type { Viewport } from 'next';
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};
```

`src/app/[locale]/layout.tsx` already has a `viewport` export — make sure you don't duplicate `themeColor` there; consolidate to one. (Severity P1 — it's a warning not a crash, but it's on the two highest-traffic routes and trivially fixable.)

---

## 4. P1 — Pervasive `as any` / `(supabase as any)` — type safety hole on the money path

### Counts (grep across `src/`)

- `(supabase as any)` / `(svc as any)`: present in **23 files** (admin CRUD, leads, my-leads, my-interests, contact-view, investors, auth/register, profiles).
- `as any` total: **199 occurrences**.
- `: any` total: **152 occurrences**.

### Worst offenders (lead/listing data path — these are the conversion-critical queries)

- `src/lib/leads/public-queries.ts:37` — `(supabase as any).from('leads')…` the entire public lead catalog query is untyped. Comment at lines 5-7 admits "Leads tables aren't in database.types.ts yet". This means TEASER_COLUMNS, filters, and the row→`LeadTeaser` mapping have ZERO compile-time protection — a renamed column ships a runtime 500 with no build error.
- `src/lib/leads/private-access.ts` — unlock/entitlement reads cast to any (the paywall logic).
- `src/app/api/leads/[code]/request/route.ts:30,40` — `(svc as any).from('lead_unlock_requests').insert(...)` — the lead-unlock write path, fully untyped.
- `src/lib/supabase/profiles.ts:12,25,42,61` — every profile read/write + `contact_views` insert untyped.
- `src/app/api/listings/route.ts:548` `(profile as any).is_trusted_seller` — the trust-gate that decides ACTIVE vs PENDING_MODERATION is an untyped property read; a typo here would silently auto-publish or auto-hide every listing.
- `src/app/api/listings/route.ts:35` `transformDepositFromDB(row: any): any` — the whole DB→frontend transform is `any`-in/`any`-out.
- `src/app/api/listings/route.ts:596` `.insert([insertData] as any)` — listing create cast.
- `src/app/api/leads/route.ts:17` `(p.get('sort') as any)` — unvalidated sort param cast straight to a union type.

### Root cause + Fix (effort: L)

The generated `src/lib/supabase/database.types.ts` is missing the newer tables (`leads`, `lead_unlock_requests`, `lead_entitlements`, `contact_views`, `profiles` extensions). Regenerate types from the live schema (`supabase gen types typescript`), then delete the `as any` casts file-by-file. Start with the 6 lead/listing-path files above (highest blast radius); the admin CRUD casts are lower priority. This is a scoped migration, not a one-shot — budget it per-file.

---

## 5. P1 — Inconsistent error handling; `handleApiError` exists but is used in 2/50 routes

### Findings

- A full-featured centralized handler exists: `src/lib/utils/error-handler.ts` (ErrorCode enum, structured responses, logger integration).
- It is imported in only **2 of 50** API route files.
- The other ~48 routes hand-roll `return NextResponse.json({ success: false, error: 'Failed to ...' }, { status: 500 })` with ad-hoc messages and inconsistent body shapes (some include `debug`, some `details`, some neither). Examples: `src/app/api/listings/[id]/route.ts:99-103,211-216,265-270`; `src/app/api/listings/route.ts:467-477`.
- **13** API route files call `console.error` directly for error logging (e.g. `src/app/api/listings/route.ts:457`) instead of the structured `logger`.

### Fix (effort: M)

Adopt `handleApiError` in all `catch` blocks across `src/app/api/**/route.ts`. This (a) standardizes the JSON error envelope, (b) removes the raw `console.error`, (c) routes through `logger` + Sentry once. Do it as a mechanical sweep; pair with §6 dedupe.

---

## 6. P1/P2 — Duplicated utility logic

- **`formatPrice` duplicated.** Canonical version in `src/lib/utils/format.ts:9-21`. A second, divergent copy is inlined in `src/app/[locale]/listings/[id]/page.tsx:261-268` (this copy uses bare `toLocaleString()` → the §2 bug). Delete the local copy, import from `format.ts`. (effort: S)
- **`getStatusText` / `getStatusColor` / `getStatusVariant` / `getTypeLabel` duplicated** across `ListingCard.tsx:13-37`, `MiningLicenseCard.tsx:24-35`, `[id]/page.tsx:28-67`, plus each per-type card. At least 4 near-identical copies, each with hard-coded Russian strings (also breaks i18n — they ignore `locale`). Consolidate into `src/lib/utils/listing-status.ts`. (effort: M)
- **`transformDepositFromDB`** (`src/app/api/listings/route.ts:35-142`) should be shared with the detail route per §1 — currently the detail route does its own (incompatible) Prisma mapping. Extract to `src/lib/listings/transform.ts`. (effort: S, unblocks §1)
- **Two stub caches**: `route.ts:145-152` defines an inline no-op `cache` object ("Temporary simplified cache while fixing Redis issues") while `src/lib/redis-cache-service.ts` is the live cache. The inline stub makes all the `sentryMiningService.trackCacheOperation('hit'…)` telemetry around it dead/misleading. Either wire the real cache or delete the stub + its telemetry. (effort: S)

---

## 7. P2 — 235 `console.*` statements in production code (CLAUDE.md forbids them)

### Counts (excluding `__tests__` / `*.test.*`)

**235** `console.(log|error|warn|debug|info)` across `src/`. Top directories:

- `src/lib/middleware` — 55
- `src/lib/database` — 37
- `src/lib/cache` — 25
- `src/lib/backup` — 16
- `src/lib/payments` — 13
- `src/lib/compliance` — 12
- `src/lib/auth` — 11
- `src/lib/services` — 10
- plus GDPR/analytics/payments API routes.

CLAUDE.md Development Rule #6 explicitly states "No Console Statements: Remove all console.log/error/warn from production code." A `logger` already exists (`src/lib/utils/logger.ts`).

### Fix (effort: M)

Sweep-replace `console.*` with the structured `logger`. Note `src/lib/cache` (25) overlaps with the dead-cache cleanup in §6 — some of these vanish for free. Add an ESLint rule `no-console` (error) to prevent regression. (Heaviest concentration is in lib infra, not user-facing components, so P2 not P1 — but it's a stated hard rule.)

---

## Severity summary

| #   | Finding                                                                  | Severity |
| --- | ------------------------------------------------------------------------ | -------- |
| 1   | Listing detail 404 — Prisma/Supabase dual-ORM drift + shape mismatch     | P0       |
| 2   | Hydration #418 — bare `area.toLocaleString()` in 3 cards                 | P0       |
| 3   | `themeColor` in metadata export (warning on top routes)                  | P1       |
| 4   | `as any` x199 / `(supabase as any)` x23 files on lead/listing money path | P1       |
| 5   | `handleApiError` used in 2/50 routes; inconsistent error envelopes       | P1       |
| 6   | Duplicated formatPrice/status/transform utils; dead stub cache           | P1/P2    |
| 7   | 235 `console.*` in production (violates CLAUDE.md)                       | P2       |
