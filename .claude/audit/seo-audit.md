# SEO Audit — QAZNEDR.KZ

Scope: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/[locale]/layout.tsx`, `public/llms.txt`, all `page.tsx` + `layout.tsx` under `src/app/[locale]/`, OG image routes, JSON-LD per page type.

Verified read-only this session. No builds run, no files modified except this artifact.

---

## TL;DR

The metadata architecture is actually solid: titles/descriptions/OG/hreflang live in per-route `layout.tsx` files (not `page.tsx`), so the "0 of 40 pages have metadata" signal from a naive grep is a **false alarm** — coverage is good for indexable content pages. The real damage is concentrated:

1. **P0 — Every `/listings/[id]` detail URL is a soft-404 with broken metadata.** Both the detail body (`/api/listings/[id]`) and the metadata (`generateMetadata` in the layout) query **Prisma**, which is empty. The two real ACTIVE listings live in **Supabase**. The sitemap publishes these URLs (priority 0.9, `daily`) → Google will crawl broken pages titled "Объявление не найдено" and may penalize for soft-404s. This is the same dual-ORM drift flagged in grounding facts, and it directly poisons SEO.
2. **P1 — Home page JSON-LD (Organization + WebSite) is client-rendered.** `src/app/[locale]/page.tsx` is `'use client'`, so the structured data is injected after hydration and is unreliable for crawlers. Same for `/listings/[id]` Product+BreadcrumbList JSON-LD (also a client component).
3. **P1 — 5 services subpages share one identical generic title/description.** `services/catalog|equipment|geological|investors|legal` have no own `layout.tsx`, so all 5 inherit "Услуги для геологической отрасли" — duplicate-title cluster.
4. **P1 — `hreflang`/sitemap has no `x-default` and no per-URL `<xhtml:link>` alternates.** Sitemap emits one row per locale URL but never links them as alternates; Google sees 4 disconnected pages, not one page in 4 languages.
5. **P2 — Footer links to non-existent `/about`, `/support`, `/legal/terms`** (404s — confirmed in grounding facts); these are crawlable internal links to dead pages.

---

## 1. Metadata coverage (per page)

Metadata is delivered via `layout.tsx` per route segment (valid Next.js pattern). Grep for `metadata` in `page.tsx` returns 0 — that is expected here and NOT a finding by itself.

### Indexable content pages WITH good metadata (via layout)

| Route                                                         | File                               | Notes                                              |
| ------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| `/[locale]` (home)                                            | `[locale]/layout.tsx:13-62`        | Root metadata + template `%s \| QAZNEDR.KZ`. Good. |
| `/listings`                                                   | `listings/layout.tsx:3-20`         | Static. No `alternates`/canonical (see §4).        |
| `/listings/[id]`                                              | `listings/[id]/layout.tsx:6-72`    | **generateMetadata via Prisma → broken (P0, §6).** |
| `/leads`                                                      | `leads/layout.tsx:5-36`            | Full hreflang. Good model to copy.                 |
| `/leads/[code]`                                               | `leads/[code]/layout.tsx:6-52`     | generateMetadata via Supabase → works. Good.       |
| `/leads/[code]/full`                                          | `leads/[code]/full/layout.tsx:4-6` | `noindex,nofollow`. Correct (gated).               |
| `/services`                                                   | `services/layout.tsx:3-20`         | Static.                                            |
| `/blog` `/news` `/companies` `/map` `/knowledge` `/education` | respective `layout.tsx`            | All present, decent. No canonical/hreflang.        |

### Indexable pages MISSING dedicated metadata (P1)

These 5 services subpages have **no own `layout.tsx`** → inherit the generic `/services` metadata, producing 5 pages with the **identical title** "Услуги для геологической отрасли" and identical description:

- `services/catalog/page.tsx` (no metadata; grep count 0)
- `services/equipment/page.tsx`
- `services/geological/page.tsx`
- `services/investors/page.tsx`
- `services/legal/page.tsx`

All 5 are listed in `sitemap.ts:13-17` and `llms.txt:51-55`, so they are crawled but collide on title. Duplicate-title cluster hurts ranking for each.

**Fix:** add a `layout.tsx` (or `generateMetadata`) to each with a unique title/description, e.g. "Геологические услуги — бурение, съёмка, опробование | QAZNEDR.KZ". Effort: **S** (5 small files, copy the `services/layout.tsx` shape).

### Private/utility pages — should be `noindex`, currently inherit `index:true` (P2)

None of these have a layout, so they inherit the root `robots: { index: true }` from `[locale]/layout.tsx:54-57`:

- `favorites/page.tsx`, `messages/page.tsx`
- `auth/login`, `auth/register`, `auth/profile-setup`
- `dashboard/*` (10 pages), `admin/*` (7 pages)
- `listings/create`, `listings/[id]/edit`, `admin/listings/new`, `admin/listings/[id]/edit`

`robots.ts:9` disallows `/dashboard/` and `/admin/` at crawl level (good), but the paths are **without the `/[locale]` prefix** — real URLs are `/ru/dashboard`, `/kz/admin`, etc. The disallow rules `['/dashboard/','/admin/']` will **NOT match** `/ru/dashboard`. So dashboard/admin are effectively crawlable. `/auth/*`, `/favorites`, `/messages` have no disallow at all and emit `index:true`.

**Fix:**

- `robots.ts`: change to locale-agnostic patterns `['/*/dashboard/', '/*/admin/', '/*/auth/', '/*/favorites', '/*/messages']` (mirror the existing `'/*/leads/*/full'` pattern that IS correct).
- Add `noindex` metadata to `auth`, `favorites`, `messages`, `dashboard`, `admin` route group layouts.
  Effort: **S** (robots) + **M** (layout files).

---

## 2. Sitemap completeness

`src/app/sitemap.ts`:

- **Locales:** all 4 (`ru, kz, en, zh`) included — line 5. Good.
- **Static pages:** 16 routes × 4 locales = 64 entries (lines 8-33). Good coverage.
- **Listings:** fetched from `/api/listings` (Supabase-backed list route) and emitted per-locale (lines 60-69). So sitemap publishes the 2 real listings — but those URLs are **broken at the detail route** (Prisma, §6). Sitemap is correct; the page it points to is broken. P0 lives in §6.
- **Leads:** fetched from `/api/leads`, per-locale (lines 96-103). Correct. Excludes `/full` (comment line 74). Good.

### Sitemap issues

- **No `alternates`/hreflang in any sitemap entry (P1).** `MetadataRoute.Sitemap` supports `alternates: { languages: {...} }`. Currently each locale URL is a standalone row with no link to its siblings → Google does not know `/ru/leads/AU-4` and `/en/leads/AU-4` are the same content. Add `alternates.languages` (incl. `x-default`) to each entry. Effort: **M**.
- **`changeFrequency`/`priority` are deprecated signals** Google ignores — harmless, leave.
- **`lastModified: new Date()` on static + lead entries (lines 29, 99)** = every crawl sees "modified now" → noise. Lead entries even ignore the real timestamp (unlike listings which use `updatedAt`, line 63). Use a build-time constant or real `updated_at`. Effort: **S**.
- **`favorites` is in the sitemap (line 23)** but is a private user page that should be `noindex` (§1). Remove from sitemap. Effort: **S**.
- **Fetch base URL is `https://qaznedr.kz` (line 4)** but live site is `https://www.qaznedr.kz`. During build/ISR the non-www may 301 → wasted fetch or, if www is canonical, a host mismatch. Verify canonical host (see §6 canonical note). Effort: **S**.

---

## 3. hreflang correctness

Root layout `[locale]/layout.tsx:45-53`:

```
alternates.languages: { ru:.../ru, en:.../en, kk:.../kz, zh:.../zh }
```

- **Locale-code mismatch (P2):** URL segment is `kz` but hreflang key is `kk`. That is actually **correct** — `kk` is the valid ISO-639 code for Kazakh; the URL slug `/kz` is just a path. Good. But **missing `x-default`** on every alternates block (root, `/leads`, `/leads/[code]`, `/listings/[id]`). Add `'x-default': '<ru url>'`. Effort: **S**.
- **Root canonical is hardcoded to `/ru` only (line 46: `canonical: 'https://qaznedr.kz'`)** — but this layout serves all 4 locales. So `/en`, `/kz`, `/zh` home pages all emit `canonical: https://qaznedr.kz` (the ru root) → Google may treat en/kz/zh home as duplicates of ru and drop them. **Canonical must be per-locale.** Convert root `metadata` to `generateMetadata(params)` and set `canonical: https://qaznedr.kz/${locale}`. Effort: **M** (root layout currently uses static `metadata`).
- **`/listings` and `/services` (+ subpages), `/blog`, `/news`, `/companies`, `/map`, `/knowledge`, `/education` have NO `alternates` at all (P2)** — no canonical, no hreflang. Only `/leads`, `/leads/[code]`, `/listings/[id]`, and root define them. Add hreflang blocks to all indexable catalog/content layouts. Effort: **M**.

---

## 4. JSON-LD per page type

| Page                                   | Type present                         | Status                                                                                                                |
| -------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Home `[locale]/page.tsx:36-71`         | Organization + WebSite(SearchAction) | **Client-rendered** (`'use client'` line 1) → unreliable for crawlers. **P1.**                                        |
| `/listings` catalog `page.tsx:150-163` | ItemList                             | Present. Likely client too (check).                                                                                   |
| `/listings/[id]` `page.tsx:119-165`    | Product + Offer + BreadcrumbList     | **Client-rendered** (page is `'use client'`, JSON-LD in `useMemo`). **P1.** Also data comes from Prisma → empty (§6). |
| `/leads/[code]` `page.tsx:45-54`       | Product + Offer                      | Present. **Missing BreadcrumbList** and not using `Place`/`GeoCoordinates` for the geological site. **P2.**           |
| `/services` `page.tsx:95-128`          | FAQPage                              | Present. Good (contradicts grounding "FAQPage missing" — it exists here).                                             |

### JSON-LD gaps

- **Organization/WebSite must be in SSR HTML (P1).** Move the home JSON-LD out of the client component into the server `layout.tsx` (render a `<script type="application/ld+json">` from `generateMetadata`'s sibling, or make a small server component). Crawlers (esp. Yandex, Baidu for `zh`) often don't execute JS.
- **No `BreadcrumbList` on `/leads/[code]`** (it exists on `/listings/[id]`). Add for consistency. Effort: **S**.
- **No `Place`/regional schema anywhere.** Region pages don't exist as routes; if SEO landing pages per region (`/ru/regions/karagandinskaya`) are planned, add `Place`. Currently N/A. P3.
- **`offers.price: 0` fallback** in `/listings/[id]` (`page.tsx:127`) and likely leads — emitting `price: 0` with `priceCurrency: KZT` is invalid Product markup (Google flags "price 0"). Use `priceSpecification` with "Contact for price" or omit `offers` when price is null. Effort: **S**.

---

## 5. Meta descriptions

- Most layouts have hand-written descriptions (good, not generic boilerplate).
- **5 services subpages** share the parent's description (§1) — duplicate. P1.
- **`/leads/[code]` description** (`leads/[code]/layout.tsx:18-23`) is well-templated with region + grade. Good model.
- **`/listings/[id]` description** (`listings/[id]/layout.tsx:33`) uses `deposit.description.slice(0,160)` — fine, but moot until §6 is fixed (deposit is always null).
- Root description (line 18-19) and OG description (line 31-32) differ slightly — fine, both quality.

---

## 6. Canonical URLs & the P0 dual-ORM break

### P0 — `/listings/[id]` detail is fully broken for SEO

- **Metadata path:** `listings/[id]/layout.tsx:14-15` → `getPrisma().kazakhstanDeposit.findUnique` → **Prisma DB is empty** → returns `{ title: 'Объявление не найдено' }` (line 27-29).
- **Body path:** `listings/[id]/page.tsx:94` → `depositApi.getById` → `/api/listings/[id]` → `src/app/api/listings/[id]/route.ts:13-17` → **also Prisma** → null → renders "Объявление не найдено".
- **Real data:** 2 ACTIVE listings (Кудер, Найзатас) live in **Supabase**, served only by the **list** route `/api/listings` (Supabase/mock-deposits), which is why the catalog shows them but the detail 404s.
- **SEO impact:** sitemap.ts publishes these detail URLs (priority 0.9, daily). Google crawls → soft-404 + duplicate "Объявление не найдено" title across every listing → crawl budget waste, possible site-quality penalty, zero ranking for the platform's core product pages.
- **Fix:** migrate `/api/listings/[id]/route.ts` AND `listings/[id]/layout.tsx` `generateMetadata` to the same Supabase query the list route uses (or back the Prisma client with the Supabase Postgres). Single source of truth. Effort: **M** (scoped migration, ~2 files + the view-tracking writes in the route).

### Canonical host

- All canonicals use `https://qaznedr.kz` (root layout line 46, leads/listings layouts) — **never vercel.app**. Good on that axis.
- **But live site is `https://www.qaznedr.kz`** (per repo brief). Canonicals point to non-www `qaznedr.kz`. If www is the served host, every page self-canonicalizes to a different host → Google may not honor or may split signals. **Decide one canonical host and make it consistent across canonicals, sitemap base URL, `robots.ts:18-19`, OG `url`, and `llms.txt`.** Effort: **S** (find/replace once host decided).
- `verification.google`/`yandex` are still placeholders `GOOGLE_VERIFICATION_CODE_HERE` (`layout.tsx:58-61`) → Search Console / Yandex Webmaster not verified. **P1** — without verification you can't submit the sitemap or see indexing. Effort: **S**.

---

## 7. OG / Twitter images

- **Dynamic OG image exists:** `[locale]/opengraph-image.tsx` (per-locale title/subtitle, 1200×630, white bg — on-brand, no gradient). Good.
- **Listing OG image exists:** `listings/[id]/opengraph-image.tsx`. Good (but moot until §6 fixed).
- **No OG image for `/leads/[code]`** — the lead layout sets `twitter.card: summary_large_image` (`leads/[code]/layout.tsx:37`) but there is **no `opengraph-image.tsx`** in that segment, so the large-image card has no image → falls back to root OG. **P2** — add `leads/[code]/opengraph-image.tsx` (teaser title + region + grade). Effort: **M**.
- **No OG image for `/leads`, `/services`, `/blog`, `/news` catalogs** — they inherit root OG image (acceptable). P3.
- Root `twitter.card: 'summary'` (`layout.tsx:39`) — small card. Could upgrade to `summary_large_image` to use the existing OG image. Effort: **S**.
- **No favicon/`icon`/`apple-icon` route found** (only opengraph-image files). Verify `public/favicon.ico` exists; missing app icons = weak SERP/branding. P3.

---

## 8. llms.txt

`public/llms.txt` is thorough and current. Minor:

- Lists `/services/*`, `/companies`, `/news`, `/knowledge`, `/map` — but **omits `/leads`** (the live lead-teaser catalog, the platform's actual primary funnel). Add the leads section. **P2.** Effort: **S**.
- Says "Hosting: Vercel / Cloudflare" and "Authentication: NextAuth.js" — auth is now Supabase Auth per brief. Minor staleness. P3.

---

## 9. themeColor / viewport warning (from grounding)

The "Unsupported metadata themeColor" warning was flagged on `/[locale]` and `/[locale]/listings`. Grep found **no `themeColor` in current `src/app/[locale]/` files** — it may be in a `head` tag, a `<meta>` in a component, or already removed. If it reappears at build, move it from any `metadata` export into the `viewport` export (root already has a `viewport` export at `layout.tsx:64-70` — add `themeColor` there). P2, S.

---

## Priority rollup

- **P0 (1):** `/listings/[id]` Prisma-vs-Supabase break → soft-404 + broken metadata on all listing detail URLs in sitemap.
- **P1 (5):** client-rendered Organization/WebSite/Product JSON-LD; 5 duplicate-title services subpages; missing per-URL hreflang/x-default + per-locale canonical (root canonical hardcoded to ru); robots disallow patterns don't match locale-prefixed dashboard/admin/auth; Search Console/Yandex verification still placeholders.
- **P2 (6):** missing canonical/hreflang on catalog & content layouts; no BreadcrumbList on leads; `price:0` invalid Product offer; no `/leads/[code]` OG image; llms.txt missing /leads; private pages not noindexed; sitemap `lastModified: now` noise; canonical host www-vs-non-www mismatch.
- **P3 (3):** no Place schema (no region routes yet); missing app icons; llms.txt stale hosting/auth line.
