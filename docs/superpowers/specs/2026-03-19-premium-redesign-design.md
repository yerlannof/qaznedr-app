# QAZNEDR.KZ — Premium Corporate Redesign

**Date:** 2026-03-19
**Status:** Approved
**Approach:** Hybrid — framework first, then page-by-page

## Problem

The current design looks AI-generated: overlapping elements, random button placement, emoji instead of icons, generic corporate copy ("Единая цифровая экосистема"), no clear visual hierarchy. The site needs to feel intentional, professional, and trustworthy — like Vercel/Notion, not like a ChatGPT template.

## Design Direction

**Premium Corporate** with blue accent. Black/dark as primary, white backgrounds, blue (#0A84FF) only for accents (links, active states, important badges). No gradients, no sparkle badges, no emoji icons.

## Design Principles

1. **Intentionality** — every element exists for a reason. No decoration for decoration's sake.
2. **Hierarchy** — one primary action per screen. Clear visual ladder: heading → subheading → content → action.
3. **Space** — generous padding. Elements don't crowd each other. Whitespace is a design element.
4. **Trust** — restrained professional tone. Numbers, facts, structure — not exclamation marks and marketing noise.

## Color System

### Base (Tailwind mapping)

| Token          | Value     | Tailwind   | Usage                          |
| -------------- | --------- | ---------- | ------------------------------ |
| Primary        | `#111827` | `gray-900` | Text, primary buttons          |
| Background     | `#FFFFFF` | `white`    | Page background                |
| Surface        | `#F9FAFB` | `gray-50`  | Card backgrounds, sections     |
| Border         | `#E5E7EB` | `gray-200` | Card borders, dividers         |
| Text secondary | `#6B7280` | `gray-500` | Secondary/muted text           |
| Text tertiary  | `#9CA3AF` | `gray-400` | Labels, captions, placeholders |

### Accent

| Token     | Value                   | Usage                                            |
| --------- | ----------------------- | ------------------------------------------------ |
| Blue      | `#0A84FF`               | Links, active states, accent badges, focus rings |
| Blue Soft | `rgba(10,132,255,0.08)` | Badge backgrounds                                |

### Semantic

| Token   | Value                  | Usage                   |
| ------- | ---------------------- | ----------------------- |
| Success | `#34C759`              | Active status, verified |
| Warning | `#EAB308` (yellow-500) | Pending, moderation     |
| Error   | `#FF3B30`              | Errors, expired         |

### Dark Mode

| Token        | Value     | Tailwind                               |
| ------------ | --------- | -------------------------------------- |
| Background   | `#0A0A0A` | custom                                 |
| Surface      | `#141414` | custom                                 |
| Border       | `#262626` | `neutral-800`                          |
| Text primary | `#F9FAFB` | `gray-50`                              |
| Text muted   | `#9CA3AF` | `gray-400` (4.6:1 contrast on #0A0A0A) |

### Rules

- **DO:** Blue only for accents. Primary buttons are black. Background is white/gray.
- **DON'T:** Blue headings. Blue primary buttons. Gradients. Multiple bright colors together. Emoji as icons.

## Typography

**Font:** Inter via `next/font/google` (replaces Geist). Configured in `src/app/layout.tsx` with `subsets: ['latin', 'cyrillic']`, `variable: '--font-inter'`.

| Level      | Size | Weight | Letter-spacing    | Color (light) | Tailwind                                                     |
| ---------- | ---- | ------ | ----------------- | ------------- | ------------------------------------------------------------ |
| Display    | 36px | 700    | -1px              | gray-900      | `text-4xl font-bold tracking-tight`                          |
| Heading    | 24px | 600    | -0.5px            | gray-900      | `text-2xl font-semibold tracking-tight`                      |
| Subheading | 16px | 600    | 0                 | gray-900      | `text-base font-semibold`                                    |
| Body       | 15px | 400    | 0                 | gray-700      | `text-[15px] text-gray-700`                                  |
| Label      | 11px | 500    | 1.5px (uppercase) | gray-400      | `text-xs font-medium uppercase tracking-wider text-gray-400` |
| Caption    | 13px | 400    | 0                 | gray-500      | `text-sm text-gray-500`                                      |

## Shadow System

Three levels only, defined as Tailwind config extensions:
| Level | Value | Usage | Tailwind |
|-------|-------|-------|----------|
| Subtle | `0 1px 2px rgba(0,0,0,0.04)` | Cards at rest | `shadow-subtle` |
| Medium | `0 4px 12px rgba(0,0,0,0.08)` | Hover state | `shadow-medium` |
| Elevated | `0 8px 30px rgba(0,0,0,0.12)` | Modals, dropdowns | `shadow-elevated` |

## Spacing

Multiples of 8px. Key values:

- `8px` (gap-2) — inner mini gaps
- `16px` (gap-4, p-4) — standard padding/gap
- `32px` (gap-8, py-8) — between blocks
- `64px` (py-16) — between page sections

Container: `max-w-7xl` with `px-4 sm:px-6 lg:px-8`.

### Responsive breakpoints (Tailwind defaults, unchanged)

- `sm`: 640px — mobile landscape
- `md`: 768px — tablet
- `lg`: 1024px — desktop
- `xl`: 1280px — wide desktop

## Icon System

Replace ALL emoji with **Lucide Icons** (`lucide-react` already installed). 1.5px stroke width, matching text color.

Mapping:

- 🛢️ Нефть → `<Droplets />`
- 🥇 Золото → `<Gem />`
- ⛽ Газ → `<Flame />`
- 🔶 Медь → `<Hexagon />`
- 📋 Лицензия → `<FileText />`
- 🏭 Завод → `<Factory />`
- ✨ Бейдж → remove entirely
- 🔍 Поиск → `<Search />`

## Components

### Buttons

4 variants only:

1. **Primary** — `bg-gray-900 text-white hover:bg-gray-800`. Main actions.
2. **Outline** — `border border-gray-200 text-gray-700 hover:border-gray-300`. Secondary actions.
3. **Accent** — `bg-[#0A84FF] text-white hover:bg-[#0070E0]`. Used rarely, for "Contact" type actions.
4. **Ghost** — `text-gray-500 hover:text-gray-900`. Tertiary actions, "Cancel".

3 sizes: sm (py-1.5 px-3.5 text-sm), default (py-2.5 px-5 text-sm), lg (py-3 px-7 text-base).
Border-radius: `rounded-lg` (8px). Font-weight: 500.

### Inputs

- Border: `border border-gray-200`
- Focus: `focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]`
- Padding: `py-2.5 px-3.5`
- Border-radius: `rounded-lg` (8px)
- Label: `text-sm font-medium text-gray-700 mb-1.5`

### Select / Dropdown

- Same border/focus/padding/radius as Input
- Chevron icon: `<ChevronDown />` from Lucide, gray-400
- Dropdown panel: white bg, `shadow-elevated`, `rounded-lg`, `border border-gray-200`
- Options: `py-2 px-3`, hover `bg-gray-50`

### Badges

- Background: semantic color at 8% opacity
- Border: semantic color at 15% opacity
- Text: semantic color (dark variant for light mode)
- Padding: `py-1 px-2.5`, border-radius: `rounded-md` (6px), font-size: `text-xs`

### Cards (Listing)

- Border: `border border-gray-200`
- Border-radius: `rounded-xl` (12px)
- Shadow at rest: `shadow-subtle`
- Hover: `hover:border-gray-300 hover:shadow-medium hover:-translate-y-0.5`
- Transition: `transition-all duration-200`
- Structure: Image → Label (type, uppercase, gray-400) → Title (font-semibold) → Region (gray-500) → divider → Price (font-bold) + Date (gray-400)

### Dialog / Modal

- Overlay: `bg-black/50 backdrop-blur-sm`
- Panel: white bg, `rounded-xl`, `shadow-elevated`, `max-w-lg`, `p-6`
- Close button: top-right, `<X />` icon, ghost style
- Dark mode: `bg-[#141414] border border-[#262626]`

### Navigation (Desktop)

- Fixed top, white background
- On scroll: `backdrop-filter: blur(12px)`, `bg-white/85`, `border-b border-gray-100`
- Logo "QAZNEDR" (text only, `font-bold tracking-tight`)
- 3 main links: Объявления, Услуги, Компании — `text-gray-500 hover:text-gray-900`, active: `text-gray-900 font-medium`
- Right side: "Войти" (ghost) + "Регистрация" (primary black button)
- "Создать объявление" moves to dashboard/catalog page — NOT in nav
- "Карта" and "Сообщения" move inside their respective sections
- No icons in nav links
- No language switcher in nav (moved to footer)
- No theme toggle in nav (moved to footer or settings)
- `NavigationSimple.tsx` is removed — one Navigation component for all pages
- Height: 64px (h-16). Content below nav gets `pt-16` to avoid overlap.

### Navigation (Mobile)

- Top bar: Logo + Search icon + Hamburger (h-14)
- Hamburger opens right-side Sheet with full menu
- Bottom tab bar (fixed, like iOS): Главная, Каталог, Подать, Профиль
- 4 items max, always visible
- Active item: blue icon + blue label. Inactive: gray-400
- Tab bar height: 56px. Content gets `pb-14` on mobile.
- New component: `src/components/layouts/MobileTabBar.tsx`

### Footer

- White background, `border-t border-gray-200`
- 4-column grid: Brand description | Platform links | Info links | Language selector + Theme toggle
- Bottom bar: copyright + location
- Clean, structured, no clutter

## Page Designs

### 1. Homepage

- **Nav** — as described above
- **Hero** — left-aligned. Label: "ПЛАТФОРМА НЕДРОПОЛЬЗОВАНИЯ" (uppercase, gray-400). Title: "Месторождения и лицензии Казахстана" (text-4xl, gray-900). Subtitle: one human sentence (gray-500). Two buttons: "Каталог" (primary) + "Разместить" (outline).
- **Stats bar** — horizontal strip below hero: 3 numbers (listings, regions, companies) with labels. Separated by borders. `border-t border-gray-200`.
- **How it works** — 3 steps, numbered. Clean cards with `border border-gray-200`, no glassmorphism. Fix i18n: move inline strings to message files.
- **Featured listings** — 3-4 listing cards in grid. "Смотреть все →" link (blue, text only).
- **Footer** — as described above
- **Remove:** sparkle badge, blue heading color, "Инновационная платформа..." copy, glassmorphic cards, `GlassCard` usage.

### 2. Catalog (Listings)

- Left sidebar filters (desktop), bottom sheet (mobile)
- Filters: clean inputs/selects with Lucide icons, no emoji in mineral options
- Listing grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Sort dropdown top-right
- Pagination: simple, clean buttons with page numbers
- View toggle: list/grid (map accessed via separate "На карте" button)
- Empty state: `<Search />` icon + text + "Сбросить фильтры" button

### 3. Listing Detail

- Breadcrumb trail
- Left column (lg:col-span-2): title, type label, description, details grid, documents
- Right column (lg:col-span-1): price card (sticky top-20), contact reveal, share button
- Details: structured grid with label-value pairs, Lucide icons, no emoji
- Remove: placeholder map ("Интерактивная карта (в разработке)"), sparkle badges

### 4. Listing Cards

- Unified structure across all 3 types (MiningLicense, Exploration, MineralOccurrence)
- Differentiated by label text only, not by entirely different card designs
- One component: refactored `ListingCard.tsx` handles all types
- Structure: Image → Type label (uppercase) → Title → Region → Price + Date
- Remove: pulse animations on "NEW" badge, glow effects, excessive Framer Motion
- Remove duplicate: `MiningLicenseCardSimple.tsx`

### 5. Dashboard

- Clean sidebar navigation (desktop), bottom tabs (mobile)
- Welcome: user name + profile type badge
- Stats cards: clean, Lucide icons, no emoji
- Quick actions: structured links, not card grid
- Profile completion: clean progress bar

### 6. Auth Pages (Login/Register)

- Centered card, `max-w-md`, `border border-gray-200 rounded-xl p-8`
- Clean form: email, password, submit
- Social login buttons: outlined, not flashy
- "или" divider between methods
- Minimal — no marketing copy on auth pages

## Animations

### Framer Motion Strategy

Keep `framer-motion` as dependency but drastically reduce usage. Use only for:

- Page entrance animations (simple `opacity` + `translateY`)
- `AnimatePresence` for mounting/unmounting (modals, mobile menu)
- Sheet/drawer animations

Do NOT use for: card hover effects (use CSS), scroll-triggered reveals, stagger effects, decorative animations.

### Keep

- `transition-all duration-150 ease-out` for hover states (CSS only)
- `opacity` + `translateY(8px)` for element appearance (Framer Motion, simple)
- `border-color` transition on cards (CSS only)
- `backdrop-filter: blur()` on scroll nav (CSS only)

### Remove

- Pulse/glow on badges
- `RevealText`, `StaggerChildren`, `FadeInWhenVisible` with complex orchestration
- `scale` animations > 1.02
- Sparkle/shimmer decorative effects
- `gradient-shift` animation

### Add

- `@media (prefers-reduced-motion: reduce)` — disable all transitions and animations
- `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]` on all interactive elements

## Copy Guidelines

- Short. Direct. No marketing noise.
- "Месторождения и лицензии Казахстана" not "Единая цифровая экосистема недропользования"
- "Покупка и продажа лицензий" not "Инновационная платформа, обеспечивающая прозрачное взаимодействие"
- "Каталог" not "Смотреть объявления →"
- Button labels: 1-2 words max. No arrows in text.
- Headings: factual, not promotional.

## Loading States

- Skeleton screens that mirror actual content structure
- Background: `bg-gray-100` (light) / `bg-neutral-800` (dark)
- Soft pulse animation: `animate-pulse` (Tailwind built-in)
- Staggered `animation-delay` per skeleton block (0.1s increments)
- No spinner — skeleton is always better

## Implementation Order

1. **Phase 1: Framework** — Navigation (desktop + mobile + tab bar), Footer, base components (Button, Input, Select, Badge, Card, Dialog)
2. **Phase 2: Homepage** — Hero, stats, how-it-works, featured listings
3. **Phase 3: Catalog + Cards** — Filters, listing grid, unified card component
4. **Phase 4: Detail** — Detail page, contact reveal, price card
5. **Phase 5: Dashboard** — Sidebar, stats, quick actions, profile
6. **Phase 6: Auth** — Login, register, profile setup
7. **Phase 7: Cleanup** — Remove dead files, unused dependencies, update CLAUDE.md

### Token Migration Strategy

Phase 1 adds NEW tokens alongside old ones (additive). Old tokens are NOT removed until Phase 7. This prevents breaking pages that haven't been redesigned yet.

## Files to Modify

### Phase 1 (Framework)

- `src/app/layout.tsx` — switch font from Geist to Inter via `next/font/google`
- `src/components/layouts/Navigation.tsx` — rewrite (replaces both Navigation and NavigationSimple)
- `src/components/layouts/MobileTabBar.tsx` — new component (mobile bottom tab bar)
- `src/components/layouts/Footer.tsx` — rewrite
- `src/components/ui/button.tsx` — update variants (black primary, remove blue default)
- `src/components/ui/input.tsx` — update styling
- `src/components/ui/select.tsx` — update styling
- `src/components/ui/badge.tsx` — update variants
- `src/components/ui/card.tsx` — update styling
- `src/components/ui/dialog.tsx` — update styling
- `src/styles/globals.css` — add new CSS tokens, `prefers-reduced-motion`, focus-visible
- `src/styles/design-tokens.ts` — add new tokens alongside old (additive)
- `tailwind.config.ts` — add custom shadows (subtle, medium, elevated)

### Phase 2 (Homepage)

- `src/app/[locale]/page.tsx` — rewrite (remove GlassCard, sparkle badge, blue headings)

### Phase 3 (Catalog + Cards)

- `src/app/[locale]/listings/page.tsx` — update layout
- `src/components/features/ListingsFilters.tsx` — update styling, replace emoji
- `src/components/cards/ListingCard.tsx` — unify all card types
- `src/components/cards/MiningLicenseCard.tsx` — rewrite (remove Framer Motion hover)
- `src/components/cards/ExplorationLicenseCard.tsx` — rewrite
- `src/components/cards/MineralOccurrenceCard.tsx` — rewrite

### Phase 4 (Detail)

- `src/app/[locale]/listings/[id]/page.tsx` — update layout
- `src/components/detail-sections/*.tsx` — update all (remove emoji, use Lucide)

### Phase 5 (Dashboard)

- `src/app/[locale]/dashboard/*.tsx` — update all pages

### Phase 6 (Auth)

- `src/app/[locale]/auth/*.tsx` — update all pages

### Phase 7 (Cleanup)

- Remove: `src/components/ui/glass-card.tsx`
- Remove: `src/components/ui/scroll-animations.tsx`
- Remove: `src/components/ui/card-new.tsx`
- Remove: `src/components/ui/interactive-link.tsx`
- Remove: `src/components/cards/MiningLicenseCardSimple.tsx`
- Remove: `src/components/layouts/NavigationSimple.tsx`
- Remove: `src/components/features/AdvancedSearchNew.tsx` (if duplicate)
- Clean: `src/styles/design-tokens.ts` — remove old tokens
- Clean: `src/styles/globals.css` — remove unused keyframes (gradient-shift, etc.)
- Update: `CLAUDE.md` — reflect new design system rules
- Audit: check if `framer-motion` can be removed or if reduced usage justifies keeping

## Out of Scope

- New features (no new functionality added)
- Database changes
- API changes
- Payment integration
- Content/data changes
- Pages not in phases 1-6: `/map`, `/news`, `/knowledge`, `/favorites`, `/admin`, service sub-pages — these inherit base component updates but layouts are not redesigned in this spec
