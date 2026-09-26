# Mobile Responsive Audit — QAZNEDR.KZ

Viewport focus: 375px primary, 414px secondary. Screenshots reviewed: `home-mobile.png`, `leads-mobile.png`, `lead-teaser-mobile.png`, `listings-mobile.png` (all 375px). Static source analysis of Navigation, Footer, MobileTabBar, leads/listings/lead-detail pages and card components.

Overall: layout is mostly fluid (max-w-7xl + responsive grids collapse to 1 col, hero uses `overflow-hidden` so the 760px decorative circles do not cause horizontal scroll). The serious mobile problems are **touch-target sizes below 44px across nearly every interactive element**, **locale-less card links that route into the broken Prisma detail route**, a **nested `<button>` inside a card `<Link>`** (invalid HTML, almost certainly the source of the confirmed React #418 hydration error on /ru/listings), and the **mobile filter bottom-sheet + footer language links being overlapped/clipped by the fixed bottom tab bar**.

---

## P0 — Broken / blocking on mobile

### 1. Listing card links drop the locale → route into the confirmed-broken detail page

- **Location:** `src/components/cards/ExplorationLicenseCard.tsx:44`, `src/components/cards/MiningLicenseCard.tsx:47`, `src/components/cards/MineralOccurrenceCard.tsx:44`
- **Issue:** `<Link href={`/listings/${deposit.id}`}>` — no `/${locale}`prefix. From`/ru/listings`a tap navigates to`/listings/[id]`, the non-localized route. This is the route that renders "Объявление не найдено" (the confirmed P0). On mobile the entire card is the tap target, so every tap on a result is broken.
- **Fix:** Prefix with locale: `href={`/${locale}/listings/${deposit.id}`}` (pass `locale` via `useTranslation()` / props). Must be coordinated with the detail-route data-source fix.
- **Effort:** S

### 2. `<button>` nested inside card `<Link>` — invalid HTML / hydration mismatch

- **Location:** `ExplorationLicenseCard.tsx:44-104` wraps `<ShowInterestButton>` (a `<button>`, `ShowInterestButton.tsx:61/78`) inside the card `<Link>`. Same pattern in the other two card variants.
- **Issue:** An interactive `<button>` inside an `<a>` is invalid HTML; React server/client render can differ → this is the most likely cause of the confirmed hydration error #418 on /ru/listings. On mobile it also makes the button's tap ambiguous (button vs. card navigation) even though `stopPropagation` is called.
- **Fix:** Move `ShowInterestButton` out of the `<Link>` (render card body in Link, action button as a sibling in a flex footer), or convert the card to a non-anchor wrapper with an inner link on the title only.
- **Effort:** M

---

## P1 — Touch targets < 44px (Apple HIG / WCAG 2.5.5) and filter/tab-bar conflicts

### 3. "Заинтересоваться" buttons far below 44px

- **Location:** `src/components/cards/ShowInterestButton.tsx:82` (full variant `px-3 py-1.5` ≈ 28px tall) and `:66` (compact variant `w-9 h-9` = 36px).
- **Issue:** Primary card action on the catalog is ~28-36px tall — hard to tap on mobile, fails 44px minimum.
- **Fix:** On mobile use `py-2.5` / `min-h-[44px]` for the full variant and `w-11 h-11` for compact (keep desktop compact if desired via `lg:`).
- **Effort:** S

### 4. Mobile filter bottom-sheet bottom is clipped by the fixed tab bar

- **Location:** `src/components/features/ListingsFilters.tsx:610` `<SheetContent side="bottom" className="h-[80vh] overflow-y-auto">`; tab bar is `fixed bottom-0 z-50 h-14` (`MobileTabBar.tsx:34-38`).
- **Issue:** The bottom sheet's apply/sort controls at its lower edge sit under the 56px tab bar; the sheet has no `pb-14`/safe-area offset. The "Применить price" button and "Сортировка"/"Быстрые фильтры" at the end of FilterContent are partially hidden behind the tab bar.
- **Fix:** Add `pb-20` (or `pb-[calc(3.5rem+env(safe-area-inset-bottom))]`) to the sheet's inner scroll container, or raise sheet `z-index` above the tab bar and pad its footer.
- **Effort:** S

### 5. Leads catalog filter sidebar does NOT collapse on mobile — pushes results far down

- **Location:** `src/app/[locale]/leads/page.tsx:82-168`. Grid is `grid-cols-1 lg:grid-cols-4`; the `<aside>` filter form is `lg:col-span-1` with no mobile collapse, so on 375px the full Region/Тип/Сортировка/checkbox/Применить form renders as a tall block ABOVE the results (confirmed in `leads-mobile.png` — entire filter card sits between hero and first lead card).
- **Issue:** Unlike the listings page (which has a proper bottom-sheet), the leads page forces users to scroll past a ~300px filter form before seeing any lead. High-value catalog buried.
- **Fix:** Mirror the listings pattern: wrap the filter `<form>` in a `lg:hidden` collapsible `<details>` / bottom-sheet trigger, render expanded only `lg:block`. Keep the GET form for no-JS/SEO but collapse visually on mobile.
- **Effort:** M

### 6. Footer language switcher + nav links are sub-44px tap targets

- **Location:** `src/components/layouts/Footer.tsx:48-145` — all footer `<Link>`s are bare `text-sm` (~14px line, no `py`). Language links (`:131-144`), Platform links (`:48-89`), Info links (`:97-122`) each have effective tap height ~20px and are stacked `space-y-2` (8px gap) → easy mis-taps on mobile, especially the 4 language links.
- **Fix:** Add `py-2 -my-1 inline-block` (or `block py-2`) to footer links so each row is ≥40px tall on mobile; keep `md:py-0` if desktop density is desired.
- **Effort:** S

### 7. ThemeToggle button below 44px

- **Location:** `src/components/ui/ThemeToggle.tsx:21` — `p-2` + `w-5 h-5` icon = 36px. Appears in Footer (`Footer.tsx:147`) and is the only theme control on mobile.
- **Fix:** `p-2.5` + ensure `min-w-[44px] min-h-[44px]` on mobile.
- **Effort:** S

### 8. Navigation hamburger button below 44px

- **Location:** `src/components/layouts/Navigation.tsx:180` — mobile menu trigger is `p-2` + `w-5 h-5` icon = 36px. It is the sole nav affordance on mobile (top-right).
- **Fix:** Bump to `p-2.5`/`min-h-[44px] min-w-[44px]`.
- **Effort:** S

---

## P2 — Polish / readability

### 9. Emoji in lead-detail headings (design-system violation + visible on mobile)

- **Location:** `src/app/[locale]/leads/[code]/page.tsx:114` (📊), `:174` (✅), `:166` (⚖️).
- **Issue:** CLAUDE.md forbids emoji in UI (use Lucide). Confirmed visible in `lead-teaser-mobile.png` ("📊 Чем подтверждена ценность", "✅ Юридический статус"). Renders inconsistently across mobile OS emoji fonts and harms the gold/serif editorial intent.
- **Fix:** Replace with Lucide icons already imported in the file (`TrendingUp`, `ShieldCheck`/`CheckCircle2`) in an inline-flex heading.
- **Effort:** S

### 10. Sub-12px body text on cards and detail page

- **Location:** `LeadCard.tsx:73` (`text-[11px]` grade label), `:85` (`text-[11px]` reserve chips); `leads/[code]/page.tsx:126/165/213/246` (`text-[12px]`); `MobileTabBar.tsx:53` (`text-[10px]` tab labels).
- **Issue:** 10-12px text is below comfortable mobile reading size (14px guideline). The 10px tab-bar labels and 11px card meta are the worst.
- **Fix:** Raise card meta to `text-xs` (12px) minimum and tab labels to `text-[11px]`; accept that micro-captions stay 12px but no 10px in primary nav.
- **Effort:** S

### 11. Filter Slider drag handle on mobile (price range)

- **Location:** `ListingsFilters.tsx:318-324` `<Slider>` inside the bottom sheet.
- **Issue:** Range slider thumbs are notoriously small for touch; verify the shadcn Slider thumb is ≥24px and the dual-thumb min/max are individually grabbable at 375px. Not visible in captured screenshots (sheet closed) but high-risk.
- **Fix:** Ensure slider thumb `h-5 w-5`+ and add touch padding; provide the numeric min/max inputs (already present `:326-344`) as the primary mobile path.
- **Effort:** S

### 12. Lead "Расположение" placeholder uses gradient background

- **Location:** `leads/[code]/page.tsx:208` `bg-gradient-to-br from-gray-50 to-gray-100` and sidebar `:223` gradient.
- **Issue:** Minor design-system note (gradients discouraged); on mobile the map placeholder is a 160px gradient box with no real content — fine functionally but flagged for consistency.
- **Fix:** Flat `bg-gray-50 dark:bg-gray-800` and a static region pin; optional.
- **Effort:** S

---

## P3 — Nice-to-have

### 13. MobileTabBar "Подать" leads to listings/create which may not be mobile-optimized

- **Location:** `MobileTabBar.tsx:22` → `/${locale}/listings/create`.
- **Issue:** Tab bar promotes "Подать" (create listing) to a top-4 mobile action, but the create flow (`listings/create/page.tsx`) was not in scope here; verify the form reflows at 375px. Low priority since most mobile users browse, not list.
- **Effort:** M

### 14. Listings page background is gray-50 while every other page is white

- **Location:** `src/app/[locale]/listings/page.tsx:161` `bg-gray-50` vs leads/lead-detail `bg-white`.
- **Issue:** Minor inconsistency; on mobile the cards (`bg-white`) float on a gray field, which actually reads fine, but differs from the rest of the app. Cosmetic.
- **Effort:** S

---

## Verified NON-issues (do not action)

- **Tab-bar vs page content overlap:** `src/app/[locale]/layout.tsx:110` wraps `{children}` in `pb-16 md:pb-0`, and `Footer.tsx:30` adds `mb-14` — content clears the 56px tab bar. The apparent overlap in `listings-mobile.png` is the dev-tools "1 Issue" React-error overlay, not the tab bar. (The underlying React error is real — see P0 #2.)
- **Hero horizontal overflow:** `PortalWelcomeHero.tsx:37` section is `overflow-hidden`; the `w-[760px]`/`w-[600px]` decorative circles (`:42/:50`) are clipped, no horizontal scrollbar at 375px.
- **Responsive grids:** leads `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` (page.tsx:185), listings `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (page.tsx:271), footer `grid-cols-2 md:grid-cols-4` (Footer.tsx:32) all collapse correctly.
