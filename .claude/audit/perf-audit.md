# QAZNEDR.KZ — Performance Audit (Static Analysis)

Scope: font cost, client-vs-server data fetching, heavy client bundles, API caching, image optimization, hydration cost. No production build was run; all findings are from source inspection.

Summary: The biggest perf liability is the **/listings catalog being a fully client-rendered tree** (`'use client'` at the page root) that fetches data in `useEffect` → blank skeleton on first paint, no SSR/SEO content, and a waterfall (HTML → JS → API → render). The **leads catalog is already done correctly** (server component, `Promise.all`, force-dynamic) and is the model to copy. Secondary wins: trim the Cormorant Garamond font from 8 faces to 2, add caching to the uncached Supabase API routes, and fix the dual-ORM detail page (also a P0 correctness bug) which currently forces a client waterfall to render "not found".

---

## 1. Font cost — Cormorant Garamond loads 8 font faces

`src/app/[locale]/layout.tsx:79-85`

```ts
const fraunces = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['300', '400', '500', '600'], // 4 weights
  style: ['normal', 'italic'], // × 2 styles = 8 font files
});
```

**Problem:** 4 weights × {normal, italic} = **8 self-hosted woff2 faces**, each in 3 subsets (latin + latin-ext + cyrillic) → ~24 subset files generated. The serif is used **only on the homepage hero** (`PortalWelcomeHero.tsx` + `AudienceSection.tsx`) per grounding facts, yet it loads on every route in the locale layout. Italic + the 300/600 weights are almost certainly not all used.

**Impact:** Each woff2 face is ~15–40 KB. Trimming to 2 faces saves ~120–250 KB of font payload sitewide and reduces font-decode/CLS work. `display: swap` is already set (good).

**Fix (S):**

- Audit actual usage in the two hero components; keep only the weights truly rendered (likely `['400','600']`, drop italic unless the hero uses it).
- Drop `style: ['normal','italic']` if italic is unused → halves the face count.
- Consider loading the serif **only in the homepage segment** (move the `Cormorant_Garamond(...)` call into a layout/component scoped to `/[locale]/page.tsx`) so internal pages ship zero serif bytes. The `--font-fraunces` CSS var can stay global; only the `@font-face` payload needs scoping.
- Verify `subsets`: if the hero copy is Cyrillic+Latin only, `latin-ext` may be droppable.

---

## 2. Client-side data fetching → blank first paint (the big one)

### 2a. /listings is fully client-rendered (P1, highest-impact perf item)

`src/app/[locale]/listings/page.tsx:1` — `'use client'` at the page root.

- State + `useEffect(loadDeposits)` at `:88-143` calls `depositApi.search()` → `GET /api/listings` **from the browser** after hydration.
- First paint renders only `<SkeletonCard/>` × 6 (`:241-247`). Real content arrives after: HTML → download page JS bundle → hydrate → fetch `/api/listings` → re-render. Classic 4-step waterfall.
- No server-rendered listing content = **zero SEO body content** (only an `ItemList` JSON-LD stub with `numberOfItems: 0` at first render, `:149-158`).
- `apiClient` base URL is empty (`src/lib/api/client.ts:8`), so this only works client-side (relative fetch); it cannot be reused server-side as-is.

**Contrast — /leads is already correct** (`src/app/[locale]/leads/page.tsx`): server component, `export const dynamic = 'force-dynamic'` (`:12`), `await Promise.all([listPublishedLeads, listLeadRegions])` (`:37-40`), renders `<LeadCard>` server-side. Filters are a plain GET `<form>` that works without JS (`:85-167`). This is the target architecture.

**Fix (M):** Convert `/listings` to a server component mirroring `/leads`:

1. Move the data read into a `server-only` query module (e.g. `src/lib/listings/public-queries.ts`) that calls the Supabase server client directly — **do not** round-trip through the public `/api/listings` HTTP route from the server (it adds a self-fetch hop + re-validation).
2. Read filters from `searchParams` (server) instead of `useSearchParams` (client).
3. Keep only the **map view toggle** and interactive bits as small client islands (`DepositMap` is already `dynamic({ ssr:false })` at `:15-28` — good). The list grid + pagination links can be server-rendered `<Link>`s like leads.
4. Add `export const dynamic = 'force-dynamic'` (or ISR `revalidate`) like leads.

**Impact:** Eliminates the JS-download→hydrate→fetch waterfall for the primary catalog. Real LCP content in the initial HTML, SEO body restored, smaller client bundle (drops `depositApi`, the fetch logic, and much of the page state machine from the client).

### 2b. /listings/[id] detail page is also client-fetched AND broken (P0)

`src/app/[locale]/listings/[id]/page.tsx:1` — `'use client'`; `useEffect` at `:88` calls `depositApi.getById()` (`:94`) and sets `'Объявление не найдено'` on miss (`:97`). This is the confirmed dual-ORM drift bug (detail reads a path that returns empty while the catalog Supabase data exists) — **and** because it's client-fetched, the failure renders only after hydrate+fetch, so the user stares at a spinner before the wrong "not found". Converting to a server component with a direct Supabase query both **fixes the bug** and removes the client waterfall, and enables real `generateMetadata` for SEO (currently impossible in a client component).

**Fix (M):** Server component + direct Supabase `getById` + `generateMetadata`. Couple this with the same query module from 2a.

---

## 3. Heavy client bundles

- **MapLibre GL** (`maplibre-gl` + `maplibre-gl.css`) — `src/components/features/DepositMap.tsx:4-5` and `src/components/features/maps/ListingsMap.tsx`. MapLibre is large (~200 KB gzipped). **Good:** both consumers already lazy-load it via `next/dynamic({ ssr:false })` — `src/app/[locale]/listings/page.tsx:15-28` and `src/app/[locale]/map/page.tsx:9-23`. No change needed; just preserve this when refactoring #2a (keep the map a dynamic island).
- **Recharts** — `src/app/[locale]/dashboard/analytics/page.tsx:11+` imports `AreaChart, BarChart, PieChart, …` **statically** (`'use client'` at `:1`), and `src/components/features/PriceTrendAnalytics.tsx` likewise. Recharts is ~100 KB+ gzipped and is eagerly bundled into the analytics route. (S/M) Wrap chart subtrees in `next/dynamic(() => import(...), { ssr:false })` so charts load only when the dashboard tab renders. Lower priority than #2 — analytics is a logged-in/secondary route, not a public landing page.
- **109 files carry `'use client'`** (`grep` count). Notably the **homepage** (`src/app/[locale]/page.tsx:1`) and **Navigation** (`src/components/layouts/Navigation.tsx:1`) are client components. Navigation being client forces it into the JS bundle of every page. (M) Where a component only needs `useTranslation`/theme but no real interactivity, consider server rendering with small client islands for the interactive menu only. The homepage hero is the LCP element — making the page shell a server component (with client islands for the mobile menu) would cut hydration JS on the most-visited route.

---

## 4. API routes hit Supabase with no caching

- `src/app/api/listings/route.ts` — `dynamic = 'force-dynamic'` (`:29`). The "cache" is a **no-op stub**: `cache.get` always returns `null` and `cache.set` does nothing (`:144-148`), with comment "Temporary simplified cache while fixing Redis issues". So **every** request runs a full Supabase `select('*', {count:'exact'})` with no caching layer. (S/M) Replace the stub with `unstable_cache` keyed on the query params + a short TTL (e.g. 60s) and a `revalidateTag('listings')` on create/update, or a small in-process TTL map. Note `select('*')` also over-fetches columns — select only card fields.
- `src/app/api/leads/route.ts` — `dynamic = 'force-dynamic'` (`:5`), `listPublishedLeads` runs a fresh Supabase query per request, no cache. (S) Wrap `listPublishedLeads` in `unstable_cache` with `revalidate: 60` + tag `leads`; published leads change rarely. `TEASER_COLUMNS` already scopes columns (good).
- The leads page server query (`src/lib/leads/public-queries.ts`) is `server-only` and re-run on every `force-dynamic` render — same caching opportunity; with only ~31 published leads, an ISR `revalidate` on the page (instead of `force-dynamic`) would serve a cached HTML page and slash TTFB.

**Impact:** With ~2 active listings and ~31 leads, the data is nearly static. Moving from `force-dynamic` (render-per-request) to `revalidate`/`unstable_cache` would make the catalogs near-instant TTFB and remove redundant Supabase round-trips.

---

## 5. Images

- **Catalog cards render icon placeholders, not real images.** `MiningLicenseCard.tsx:49-55` (and the lead/exploration/occurrence cards) show a Lucide `<MineralIcon>`/`<Gem>` inside a fixed-height box — `LeadCard.tsx:30-33`. So there's **no per-card image download** today (good for now), but also `deposit.images[0]` is never rendered even when present. When real listing images are added, they must use `next/image` with `sizes` + explicit dimensions to avoid CLS.
- **Service/news pages use `next/image` correctly-ish:**
  - `services/equipment/page.tsx:511-518` — `fill` + `sizes` present (good).
  - `services/legal/page.tsx:565` — `fill` present; verify a `sizes` prop exists (a `fill` image without `sizes` makes Next emit a full-viewport srcset → over-download). (S)
  - `news/page.tsx:527-531` — `<Image src="/images/placeholder-news.jpg" fill className="object-cover" />` has **no `sizes`** → with `fill`, Next defaults to `100vw` srcset and over-downloads for grid thumbnails. Add `sizes="(max-width:768px) 100vw, 33vw"`. (S) Also every news card uses the same static placeholder — fine, but mark the first above-the-fold one `priority` and let the rest lazy-load (default).
- **No `priority` on any LCP image.** The homepage hero is text/serif (no image), so likely fine, but confirm no hero `<Image>` lacks `priority`. (S)
- `next.config.ts:47-50` is healthy: `formats: ['image/webp','image/avif']`, sensible `deviceSizes`, 30-day cache header for `/images/*` (`:166`). No change needed.
- A `LazyImage` wrapper exists (`src/components/ui/LazyImage.tsx`) with `quality`, `sizes`, `priority` props but is not used by the catalog cards. Standardize on it when card images land.

---

## 6. Hydration error on /listings forces full client re-render

Per grounding facts, React error **#418** ("server rendered text didn't match client") fires on `/ru/listings`. Because the page is `'use client'` with `useSearchParams`/locale-derived text and `suppressHydrationWarning` is only on `<html>` (`layout.tsx:103`), a mismatch makes React **throw away the server HTML for that subtree and re-render on the client** — wasted work + visible flash, compounding the already-client-rendered nature of the page. Converting the page to a server component (#2a) removes the class of mismatch entirely (no client-derived text in initial render). Until then, ensure locale/translation-derived strings are deterministic between server and client.

Related: **`Unsupported metadata themeColor`** warning on `/[locale]` and `/[locale]/listings`. `themeColor` must move from the `metadata` export to the `viewport` export. The `viewport` export already exists at `layout.tsx:64-70` — just add `themeColor` there and remove it from any `metadata`. (S) Minor, but it's logged on every render.

---

## Priority-ordered fix list

| #   | Item                                                                                                            | Severity | Effort | File:line                                                             |
| --- | --------------------------------------------------------------------------------------------------------------- | -------- | ------ | --------------------------------------------------------------------- |
| 1   | /listings/[id] dual-ORM → server component + Supabase + generateMetadata (fixes "not found" + client waterfall) | P0       | M      | `src/app/[locale]/listings/[id]/page.tsx:1,88-103`                    |
| 2   | /listings catalog: client `useEffect` fetch → SSR server component (copy /leads pattern)                        | P1       | M      | `src/app/[locale]/listings/page.tsx:1,88-143`                         |
| 3   | Trim Cormorant Garamond 8 faces → 2; scope to homepage segment                                                  | P1       | S      | `src/app/[locale]/layout.tsx:79-85`                                   |
| 4   | Add caching to uncached Supabase routes (stub is a no-op)                                                       | P1       | S/M    | `src/app/api/listings/route.ts:144-148`; `src/app/api/leads/route.ts` |
| 5   | Replace catalog `force-dynamic` with ISR `revalidate` (data near-static)                                        | P2       | S      | `leads/page.tsx:12`; listings after #2                                |
| 6   | Lazy-load recharts on analytics/PriceTrendAnalytics                                                             | P2       | S/M    | `dashboard/analytics/page.tsx:11`; `PriceTrendAnalytics.tsx`          |
| 7   | Add `sizes` to `fill` images (news, legal)                                                                      | P2       | S      | `news/page.tsx:527`; `services/legal/page.tsx:565`                    |
| 8   | Move `themeColor` from metadata → viewport export                                                               | P3       | S      | `src/app/[locale]/layout.tsx:64-70`                                   |
| 9   | Server-render Navigation/homepage shell with client islands                                                     | P3       | M      | `Navigation.tsx:1`; `[locale]/page.tsx:1`                             |
| 10  | `select('*')` over-fetch → select card columns only                                                             | P3       | S      | `src/app/api/listings/route.ts:256-257`                               |
