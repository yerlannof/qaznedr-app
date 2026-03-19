# Premium Corporate Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform QAZNEDR.KZ from AI-generated look to Premium Corporate design (Vercel/Notion style) across all pages.

**Architecture:** Hybrid approach — Phase 1 builds the design framework (font, tokens, base components, navigation, footer). Phases 2-6 apply the framework page-by-page. Phase 7 removes dead code. Each phase is independently committable.

**Tech Stack:** Next.js 15, Tailwind CSS (v3 as installed), TypeScript, Lucide Icons, Inter font via next/font/google. Framer Motion kept but drastically reduced.

**Spec:** `docs/superpowers/specs/2026-03-19-premium-redesign-design.md`

**Notes:**

- `src/styles/design-tokens.ts` is not imported anywhere in the codebase — it is dead code. We skip updating it and delete it in Phase 7 cleanup instead.
- Loading states: existing skeleton components use `animate-pulse` which matches the spec. No dedicated loading state task needed — existing patterns are fine.
- `link` and `destructive` button variants are kept beyond the spec's 4 variants because they are used across the codebase for text links and delete actions respectively.
- Tailwind v3 is actually installed (not v4 as CLAUDE.md claims). Plan and code target v3. Task 22 corrects CLAUDE.md.

---

## Phase 1: Framework

### Task 1: Switch Font to Inter

**Files:**

- Modify: `src/app/[locale]/layout.tsx` (this is where Geist font is currently configured, NOT `src/app/layout.tsx`)
- Modify: `src/styles/globals.css` (remove Geist @font-face)

- [ ] **Step 1: Update `src/app/[locale]/layout.tsx` — replace Geist with Inter**

Replace Geist font import with Inter from `next/font/google`:

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});
```

Apply `inter.variable` and `inter.className` to the `<html>` or `<body>` tag. Remove any Geist font references.

- [ ] **Step 2: Remove Geist font-face from globals.css**

Remove the `@font-face` block for Geist (around line 220-223 in globals.css). Update any `font-family` references from Geist to Inter.

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Passes. Font renders as Inter across the site.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/layout.tsx src/styles/globals.css
git commit -m "style: switch font from Geist to Inter"
```

---

### Task 2: Update Tailwind Config — Shadows & Color Tokens

**Files:**

- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add custom shadow scale**

In `tailwind.config.ts`, extend `boxShadow`:

```ts
boxShadow: {
  subtle: '0 1px 2px rgba(0,0,0,0.04)',
  medium: '0 4px 12px rgba(0,0,0,0.08)',
  elevated: '0 8px 30px rgba(0,0,0,0.12)',
},
```

- [ ] **Step 2: Fix primary color consistency**

Ensure `primary` stays `#0A84FF`. Add dark mode background tokens:

```ts
colors: {
  primary: '#0A84FF',
  // ... keep existing
  'dark-bg': '#0A0A0A',
  'dark-surface': '#141414',
  'dark-border': '#262626',
},
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Passes. New shadow and color utilities available.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts
git commit -m "style: add shadow scale and dark mode tokens to tailwind config"
```

---

### Task 3: Update Global Styles — Reduced Motion, Focus Visible

**Files:**

- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add prefers-reduced-motion**

Add at the end of the `@layer base` block:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Add focus-visible base style**

Add to `@layer base`:

```css
:focus-visible {
  outline: 2px solid #0a84ff;
  outline-offset: 2px;
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "style: add reduced-motion and focus-visible global styles"
```

---

### Task 4: Redesign Button Component

**Files:**

- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Read current button.tsx**

Read the file to understand current CVA variants and interface.

- [ ] **Step 2: Update CVA variants**

Replace the variant definitions. New variants:

- `default` (primary): `bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200`
- `outline`: `border border-gray-200 bg-transparent text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300`
- `accent`: `bg-[#0A84FF] text-white hover:bg-[#0070E0]`
- `ghost`: `text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-50 dark:hover:bg-gray-800`
- `link`: `text-[#0A84FF] underline-offset-4 hover:underline`
- `destructive`: `bg-red-500 text-white hover:bg-red-600`

Update sizes to match spec:

- `sm`: `h-8 px-3.5 text-sm rounded-lg`
- `default`: `h-10 px-5 text-sm rounded-lg`
- `lg`: `h-12 px-7 text-base rounded-lg`

Keep the loading state, icon support, and `asChild` pattern. Remove the `xl` size.

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Passes. Some pages may look different (blue buttons now black) — this is expected.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "style: redesign button component — black primary, new variants"
```

---

### Task 5: Redesign Input Component

**Files:**

- Modify: `src/components/ui/input.tsx`

- [ ] **Step 1: Update input styling**

Update the className to match spec:

```
border border-gray-200 bg-white rounded-lg py-2.5 px-3.5 text-sm text-gray-900
placeholder:text-gray-400
focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] focus:outline-none
dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:placeholder:text-gray-500
disabled:cursor-not-allowed disabled:opacity-50
transition-colors duration-150
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/input.tsx
git commit -m "style: redesign input component"
```

---

### Task 6: Redesign Badge Component

**Files:**

- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1: Update badge variants**

Replace CVA variants with:

- `default`: `bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`
- `blue`: `bg-[rgba(10,132,255,0.08)] text-[#0A84FF] border border-[rgba(10,132,255,0.15)]`
- `success`: `bg-[rgba(52,199,89,0.08)] text-green-700 border border-[rgba(52,199,89,0.15)] dark:text-green-400`
- `warning`: `bg-[rgba(234,179,8,0.08)] text-yellow-700 border border-[rgba(234,179,8,0.15)] dark:text-yellow-400`
- `error`: `bg-[rgba(255,59,48,0.08)] text-red-600 border border-[rgba(255,59,48,0.15)] dark:text-red-400`

Change border-radius from `rounded-full` to `rounded-md` (6px).
Padding: `py-1 px-2.5`. Font: `text-xs font-medium`.

- [ ] **Step 2: Build and verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "style: redesign badge component — semantic variants"
```

---

### Task 7: Redesign Card Component

**Files:**

- Modify: `src/components/ui/card.tsx`

- [ ] **Step 1: Update Card base styling**

Update Card className:

```
rounded-xl border border-gray-200 bg-white shadow-subtle
transition-all duration-200
dark:border-gray-700 dark:bg-[#141414]
```

Update CardTitle: `text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50`
Update CardDescription: `text-sm text-gray-500`

- [ ] **Step 2: Build and verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "style: redesign card component"
```

---

### Task 8: Redesign Select Component

**Files:**

- Modify: `src/components/ui/select.tsx`

- [ ] **Step 1: Update SelectTrigger styling**

Match input styling: `border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm`. Focus: same as input. Use `<ChevronDown />` from Lucide, `text-gray-400`.

- [ ] **Step 2: Update SelectContent styling**

Dropdown panel: `bg-white shadow-elevated rounded-lg border border-gray-200 dark:bg-[#141414] dark:border-gray-700`

- [ ] **Step 3: Update SelectItem styling**

Options: `py-2 px-3 text-sm`, hover: `bg-gray-50 dark:bg-gray-800`

- [ ] **Step 4: Build and verify**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/select.tsx
git commit -m "style: redesign select component"
```

---

### Task 9: Redesign Dialog Component

**Files:**

- Modify: `src/components/ui/dialog.tsx`

- [ ] **Step 1: Update DialogOverlay**

Overlay: `bg-black/50 backdrop-blur-sm`

- [ ] **Step 2: Update DialogContent**

Panel: `bg-white rounded-xl shadow-elevated max-w-lg p-6 border-0 dark:bg-[#141414] dark:border dark:border-[#262626]`

- [ ] **Step 3: Build and verify**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/dialog.tsx
git commit -m "style: redesign dialog component"
```

---

### Task 10: Redesign Navigation

**Files:**

- Modify: `src/components/layouts/Navigation.tsx` — full rewrite

- [ ] **Step 1: Read current Navigation.tsx fully**

Understand all current features: scroll behavior, user menu, mobile sheet, i18n.

- [ ] **Step 2: Rewrite Navigation.tsx**

New navigation structure:

- **Desktop:** Fixed top, `h-16`, white bg. On scroll: `bg-white/85 backdrop-blur-xl border-b border-gray-100`.
- **Logo:** "QAZNEDR" text only — `font-bold tracking-tight text-gray-900`. No blue square icon.
- **Links:** 3 items only — Объявления, Услуги, Компании. `text-gray-500 hover:text-gray-900 text-sm font-medium`. Active: `text-gray-900`.
- **Right side:** "Войти" (ghost button) + "Регистрация" (primary black button). When logged in: user avatar dropdown.
- **No:** icons in nav links, language switcher, theme toggle, "Создать объявление" button, scroll progress bar.
- **Mobile:** Logo + Search icon + Hamburger. Sheet opens from right with full nav links + user section.

Remove all Framer Motion usage. Use CSS transitions only.
Content below nav: `pt-16` to prevent overlap (the main bug user reported).

- [ ] **Step 3: Replace ALL NavigationSimple imports across the codebase**

NavigationSimple is imported in ~27 files across the project. Run:

```bash
grep -r "NavigationSimple" src/ --include="*.tsx" -l
```

Replace every import of `NavigationSimple` with `Navigation` in ALL files found. This includes homepage, services pages, companies, listings create/edit, knowledge, news, map, favorites, and others. Do NOT skip any file — every NavigationSimple reference must be updated or the build will break when we delete NavigationSimple.tsx in Phase 7.

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Passes. Navigation appears clean and consistent on all pages.

- [ ] **Step 5: Commit**

```bash
git add src/components/layouts/Navigation.tsx src/app/
git commit -m "style: redesign navigation — clean, fixed, no overlap"
```

---

### Task 11: Create Mobile Tab Bar

**Files:**

- Create: `src/components/layouts/MobileTabBar.tsx`
- Modify: `src/app/[locale]/layout.tsx` (or wherever main layout wraps pages)

- [ ] **Step 1: Create MobileTabBar component**

Bottom tab bar, visible only on mobile (`md:hidden`). Fixed bottom, white bg, `border-t border-gray-200`.

4 tabs with Lucide icons:

1. Главная — `<Home />` — links to `/`
2. Каталог — `<Search />` — links to `/listings`
3. Подать — `<Plus />` — links to `/listings/create`
4. Профиль — `<User />` — links to `/dashboard`

Active tab: blue icon + blue label (`text-[#0A84FF]`). Inactive: `text-gray-400`.
Tab bar height: `h-14`. Safe area padding bottom for iOS.

- [ ] **Step 2: Add MobileTabBar to `src/app/[locale]/layout.tsx`**

Add `<MobileTabBar />` after the `{children}` in the locale layout. This centralizes it — no need to add to every page. Wrap `{children}` in a `<main className="pb-14 md:pb-0">` to prevent tab bar overlap on mobile. MobileTabBar is `md:hidden` so it only renders on mobile.

- [ ] **Step 3: Build and verify**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/layouts/MobileTabBar.tsx src/app/
git commit -m "feat: add mobile bottom tab bar"
```

---

### Task 12: Redesign Footer

**Files:**

- Modify: `src/components/layouts/Footer.tsx`

- [ ] **Step 1: Read current Footer.tsx**

Understand current structure and i18n usage.

- [ ] **Step 2: Rewrite Footer**

New footer:

- White background (not dark `bg-gray-900`): `bg-white border-t border-gray-200 dark:bg-[#0A0A0A] dark:border-[#262626]`
- 4-column grid:
  1. **Brand:** "QAZNEDR" logo + short description (1-2 sentences, gray-500)
  2. **Платформа:** Объявления, Услуги, Компании, Карта (gray-500 links, hover:text-gray-900)
  3. **Информация:** О платформе, Контакты, Правила
  4. **Язык + Тема:** Language selector (4 languages), theme toggle
- Column headers: `text-xs font-medium uppercase tracking-wider text-gray-400`
- Bottom bar: `border-t border-gray-200`, copyright left, "Астана, Казахстан" right, `text-xs text-gray-400`

Padding: `py-12 px-4 sm:px-6 lg:px-8` for main grid. `py-4` for bottom bar.

- [ ] **Step 3: Build and verify**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/layouts/Footer.tsx
git commit -m "style: redesign footer — white bg, 4-column grid"
```

---

## Phase 2: Homepage

### Task 13: Redesign Homepage

**Files:**

- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Read current homepage fully**

Note all GlassCard, GlassButton, scroll animation imports and usages.

- [ ] **Step 2: Remove glass/animation imports**

Remove imports of: `GlassCard`, `GlassButton`, `FadeInWhenVisible`, `RevealText`, `StaggerChildren`, `InteractiveLink`, `InteractiveButton`. Remove Framer Motion `motion` import.

- [ ] **Step 3: Rewrite Hero section**

```
Container max-w-7xl, py-20 lg:py-28
Left-aligned text (not centered):
  - Label: "ПЛАТФОРМА НЕДРОПОЛЬЗОВАНИЯ" — text-xs uppercase tracking-wider text-gray-400 font-medium
  - Title: "Месторождения и лицензии Казахстана" — text-4xl lg:text-5xl font-bold tracking-tight text-gray-900
  - Subtitle: "Покупка и продажа горнодобывающих лицензий, участков разведки и минеральных объектов." — text-base lg:text-lg text-gray-500 mt-4 max-w-xl
  - Buttons: mt-8, flex gap-3
    - "Каталог" — primary button (Link to /listings)
    - "Разместить" — outline button (Link to /listings/create)
```

No gradient backgrounds. White bg. No sparkle badge.

- [ ] **Step 4: Rewrite Stats bar**

```
border-t border-gray-200, grid grid-cols-3
Each stat: py-6, border-r border-gray-200 (except last)
  - Number: text-3xl font-bold text-gray-900
  - Label: text-xs text-gray-400 uppercase tracking-wider mt-1
```

3 stats: listings count (from API), "14" regions, companies count.

- [ ] **Step 5: Rewrite How It Works section**

```
py-16, bg-gray-50 dark:bg-[#0A0A0A]
Title: "Как это работает" — text-2xl font-semibold tracking-tight text-center
grid grid-cols-1 md:grid-cols-3 gap-8 mt-12
Each step: border border-gray-200 rounded-xl p-6 bg-white dark:bg-[#141414]
  - Step number: text-xs font-medium text-gray-400
  - Icon: Lucide icon, text-gray-400, mb-3
  - Title: text-base font-semibold text-gray-900
  - Description: text-sm text-gray-500
```

Fix i18n: use translation keys from message files instead of inline locale switches.

- [ ] **Step 6: Rewrite Featured Listings section**

```
py-16
Title: "Объявления" — text-2xl font-semibold + "Смотреть все" link (text-[#0A84FF] text-sm)
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8
```

Fetch recent listings and render with the existing ListingCard component (which will be redesigned in Phase 3).

- [ ] **Step 7: Remove CTA section with dark bg**

Remove the dark CTA section. The homepage is clean: Hero → Stats → How It Works → Featured → Footer.

- [ ] **Step 8: Remove Trust section with GlassCards**

Stats are now integrated into the stats bar. Remove the separate trust section.

- [ ] **Step 9: Build and verify**

Run: `npm run build`
Expected: Passes. Homepage is clean, left-aligned, no glass effects.

- [ ] **Step 10: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "style: redesign homepage — premium corporate, no glass effects"
```

---

## Phase 3: Catalog + Cards

### Task 14: Redesign Unified Listing Card

**Files:**

- Modify: `src/components/cards/ListingCard.tsx`
- Modify: `src/components/cards/MiningLicenseCard.tsx`
- Modify: `src/components/cards/ExplorationLicenseCard.tsx`
- Modify: `src/components/cards/MineralOccurrenceCard.tsx`

- [ ] **Step 1: Read all card components**

Read ListingCard.tsx (router), and all 3 type-specific cards. Understand props interface and data flow.

- [ ] **Step 2: Rewrite MiningLicenseCard**

Remove ALL Framer Motion (`motion.div`, `whileHover`, `whileTap`, animated badges).
New structure — CSS only:

```
<article> with:
  rounded-xl border border-gray-200 bg-white shadow-subtle
  hover:border-gray-300 hover:shadow-medium hover:-translate-y-0.5
  transition-all duration-200 cursor-pointer overflow-hidden

  Image container: h-48, bg-gray-100, overflow-hidden
    - Actual image or placeholder
    - Status badge (top-right): absolute, using new Badge component

  Content: p-4
    - Type label: text-xs font-medium uppercase tracking-wider text-gray-400 — "ГОРНОДОБЫВАЮЩАЯ ЛИЦЕНЗИЯ"
    - Title: text-base font-semibold text-gray-900 mt-1 line-clamp-1
    - Region: text-sm text-gray-500 mt-1
    - Divider: border-t border-gray-100 mt-3 pt-3
    - Price row: flex justify-between items-center
      - Price: text-lg font-bold text-gray-900
      - Date: text-xs text-gray-400
```

- [ ] **Step 3: Rewrite ExplorationLicenseCard**

Same structure as MiningLicenseCard. Only type label differs: "УЧАСТОК РАЗВЕДКИ". Same styles, same layout.

- [ ] **Step 4: Rewrite MineralOccurrenceCard**

Same structure. Label: "МИНЕРАЛЬНОЕ ПРОЯВЛЕНИЕ".

- [ ] **Step 5: Verify ListingCard router still works**

ListingCard.tsx delegates to the correct card type. Verify it still imports and renders correctly.

- [ ] **Step 6: Build and verify**

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/components/cards/
git commit -m "style: redesign listing cards — unified structure, no Framer Motion"
```

---

### Task 15: Redesign Listings Filters

**Files:**

- Modify: `src/components/features/ListingsFilters.tsx`

- [ ] **Step 1: Read current ListingsFilters.tsx**

- [ ] **Step 2: Replace all emoji with Lucide icons**

Replace emoji mineral icons (🛢️, 🥇, ⛽, 🔶, etc.) with corresponding Lucide icons as per spec mapping.

- [ ] **Step 3: Update filter UI styling**

- Section labels: `text-xs font-medium uppercase tracking-wider text-gray-400`
- Inputs/selects: use updated Input and Select components
- Price slider: update colors to gray-900 track, gray-200 rail
- Filter buttons: use updated Button component
- Reset link: ghost button style

- [ ] **Step 4: Build and verify**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/features/ListingsFilters.tsx
git commit -m "style: redesign listings filters — Lucide icons, clean styling"
```

---

### Task 16: Redesign Listings Page

**Files:**

- Modify: `src/app/[locale]/listings/page.tsx`

- [ ] **Step 1: Read current listings page**

- [ ] **Step 2: Update page header**

```
pt-16 (for nav clearance)
Title: "Объявления" — text-2xl font-semibold tracking-tight
Subtitle: listing count — text-sm text-gray-500
```

- [ ] **Step 3: Update grid layout**

```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
```

- [ ] **Step 4: Update pagination**

Clean pagination buttons using Button component (outline variant). Current page: primary variant.

- [ ] **Step 5: Update empty state**

`<Search />` icon (gray-300, w-10 h-10) + "Ничего не найдено" (font-semibold) + description (text-sm text-gray-500) + "Сбросить фильтры" button (primary).

- [ ] **Step 6: Replace emoji in view toggles and sort**

Use Lucide icons for grid/list view toggle. Clean styling.

- [ ] **Step 7: Build and verify**

Run: `npm run build`

- [ ] **Step 8: Commit**

```bash
git add src/app/[locale]/listings/page.tsx
git commit -m "style: redesign listings page — clean grid, no emoji"
```

---

## Phase 4: Listing Detail

### Task 17: Redesign Listing Detail Page

**Files:**

- Modify: `src/app/[locale]/listings/[id]/page.tsx`

- [ ] **Step 1: Read current detail page**

- [ ] **Step 2: Update layout structure**

```
pt-16 (nav clearance)
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8
Breadcrumb at top

Two columns on lg:
  Left (lg:col-span-2): title section, description, type-specific details, documents
  Right (lg:col-span-1): price card (sticky top-20), contact reveal, share

Mobile: single column, price card at bottom
```

- [ ] **Step 3: Update title section**

```
Type label: text-xs uppercase tracking-wider text-gray-400
Title: text-2xl font-semibold tracking-tight text-gray-900
Status badge: new Badge component (success/warning/error variant)
```

- [ ] **Step 4: Update price card**

```
Sticky right sidebar card:
  border border-gray-200 rounded-xl p-6 bg-white shadow-subtle
  Price: text-2xl font-bold text-gray-900
  Contact button: accent variant Button
  Share: ghost button with <Share2 /> icon
```

- [ ] **Step 5: Remove placeholder map and sparkle badges**

Remove "Интерактивная карта (в разработке)" placeholder. Remove any sparkle/glass elements.

- [ ] **Step 6: Build and verify**

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/listings/
git commit -m "style: redesign listing detail page"
```

---

### Task 18: Redesign Detail Sections

**Files:**

- Modify: `src/components/detail-sections/MiningLicenseDetails.tsx`
- Modify: `src/components/detail-sections/ExplorationLicenseDetails.tsx`
- Modify: `src/components/detail-sections/MineralOccurrenceDetails.tsx`

- [ ] **Step 1: Read all detail section components**

- [ ] **Step 2: Replace emoji with Lucide icons**

Replace all emoji (📋, 🏭, etc.) with corresponding Lucide icons. Use `text-gray-400` for icons.

- [ ] **Step 3: Update detail grid styling**

```
Grid of label-value pairs:
  grid grid-cols-1 sm:grid-cols-2 gap-4
  Each item:
    Label: text-xs font-medium uppercase tracking-wider text-gray-400
    Value: text-sm font-medium text-gray-900 mt-1
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/detail-sections/
git commit -m "style: redesign detail sections — Lucide icons, clean grid"
```

---

## Phase 5: Dashboard

### Task 19: Redesign Dashboard Pages

**Files:**

- Modify: `src/app/[locale]/dashboard/page.tsx`
- Modify: `src/app/[locale]/dashboard/my-listings/page.tsx`
- Modify: `src/app/[locale]/dashboard/profile/page.tsx`
- Modify: `src/app/[locale]/dashboard/analytics/page.tsx`
- Modify: `src/app/[locale]/dashboard/personal/page.tsx`
- Modify: `src/app/[locale]/dashboard/messages/page.tsx`

- [ ] **Step 1: Read all dashboard pages**

- [ ] **Step 2: Redesign main dashboard page**

```
Welcome: "Привет, {name}" — text-2xl font-semibold tracking-tight
Profile type: Badge component (blue variant)
Profile completion: clean progress bar (bg-gray-200 track, bg-gray-900 fill)
Stats: grid of cards with Lucide icons (no emoji), border border-gray-200 rounded-xl
Quick actions: text links with icons, not card grid
```

- [ ] **Step 3: Update other dashboard pages**

Apply same styling patterns: gray-based colors, Lucide icons, clean cards, consistent typography.

- [ ] **Step 4: Build and verify**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/dashboard/
git commit -m "style: redesign dashboard pages"
```

---

## Phase 6: Auth

### Task 20: Redesign Auth Pages

**Files:**

- Modify: `src/app/[locale]/auth/login/page.tsx`
- Modify: `src/app/[locale]/auth/register/page.tsx`
- Modify: `src/app/[locale]/auth/profile-setup/page.tsx`

- [ ] **Step 1: Read all auth pages**

- [ ] **Step 2: Redesign login page**

```
Centered layout: flex items-center justify-center min-h-screen
Card: max-w-md w-full border border-gray-200 rounded-xl p-8 bg-white
  Title: "Войти" — text-2xl font-semibold tracking-tight text-center
  Form: mt-8, flex flex-col gap-4
    Email input with label
    Password input with label
    Submit: primary Button, full-width
  Divider: "или" with gray lines
  Social buttons: outline Button, full-width
  Link: "Нет аккаунта? Зарегистрироваться" — text-sm text-gray-500, link is text-[#0A84FF]
```

No marketing copy. No background decorations.

- [ ] **Step 3: Redesign register page**

Same pattern as login. Additional fields as needed.

- [ ] **Step 4: Redesign profile-setup page**

Clean step indicator. Form fields with proper labels and inputs.

- [ ] **Step 5: Build and verify**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/app/[locale]/auth/
git commit -m "style: redesign auth pages — centered, minimal"
```

---

## Phase 7: Cleanup

### Task 21: Remove Dead Files

**Files:**

- Delete: `src/components/ui/glass-card.tsx`
- Delete: `src/components/ui/scroll-animations.tsx`
- Delete: `src/components/ui/card-new.tsx`
- Delete: `src/components/ui/interactive-link.tsx`
- Delete: `src/components/cards/MiningLicenseCardSimple.tsx`
- Delete: `src/components/layouts/NavigationSimple.tsx`
- Delete: `src/components/features/AdvancedSearchNew.tsx` (if duplicate)

- [ ] **Step 1: Search for imports of each file**

For each file to be deleted, search the codebase for any remaining imports. Fix any broken imports before deleting.

- [ ] **Step 2: Delete files**

Remove all listed files.

- [ ] **Step 3: Clean globals.css**

Remove unused keyframes: `gradient-shift`, any other unused animations. Remove old OKLch variable definitions if no longer referenced.

- [ ] **Step 4: Clean design-tokens.ts**

Remove old token values that are no longer referenced. Keep only tokens that are actually imported somewhere.

- [ ] **Step 5: Audit Framer Motion usage**

Run `grep -r "from 'framer-motion'" src/ --include="*.tsx" -l` and check every remaining import. Remove `motion.div`, `whileHover`, `whileTap`, scroll animations from any files not yet cleaned up. Keep only: `AnimatePresence` for mount/unmount (modals, mobile menu sheet).

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: Passes with zero errors. All dead code removed.

- [ ] **Step 7: Run lint and tests**

Run: `npm run lint && npm run test`
Expected: Both pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: remove dead files, audit Framer Motion, cleanup"
```

---

### Task 22: Update CLAUDE.md

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Update Design System Constraints section**

Replace current design rules with:

- Colors: Gray base (gray-900 primary text) + blue accent (#0A84FF). No gradients. No bright colors.
- Buttons: Primary is black (bg-gray-900), not blue. Blue only for accent variant.
- Typography: Inter font. Tight tracking on headings.
- Animations: CSS transitions only for hover. Framer Motion only for mount/unmount (AnimatePresence). No pulse, glow, sparkle.
- Icons: Lucide only. No emoji in UI.
- Copy: Short, direct. No marketing noise.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with new design system rules"
```

---

## Verification Checklist (After All Phases)

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] All pages render correctly in light mode
- [ ] All pages render correctly in dark mode
- [ ] Navigation doesn't overlap content on any page
- [ ] Mobile bottom tab bar works on all pages
- [ ] No emoji anywhere in the UI (search codebase for common emoji)
- [ ] No blue primary buttons (all primary buttons are black)
- [ ] No GlassCard, GlassButton, or scroll-animation imports remain
- [ ] Footer shows language selector and theme toggle
- [ ] Cards hover with subtle shadow lift
- [ ] `prefers-reduced-motion` disables all animations
