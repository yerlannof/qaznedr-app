# QAZNEDR.KZ — Heavy Design / UX Audit

Dimension: gap between the premium gold/serif/ink editorial aesthetic (homepage only) and the generic Tailwind reality of every internal page. Desktop (1440px) + mobile (375px).

## TL;DR

The premium editorial system (Cormorant serif, gold-on-ink, atmospheric layers, gold CTAs) lives **exclusively** in `PortalWelcomeHero.tsx` and `AudienceSection.tsx` on the homepage. `grep font-serif` returns ONLY those two files — **no internal page renders a single serif heading or serif price**. Every catalog, teaser, detail, nav, footer and 404 page is generic gray/blue Tailwind with `font-bold` sans headings. The brand promise set by the homepage collapses on the second click. On top of that there are hard breakages: the bare unstyled `not-found.tsx`, emoji headings in the lead teaser, all listing cards linking to a locale-less broken detail route, and a blue-primary listing-card system that contradicts the gold accent + black-primary design law.

---

## P0 — Broken / contract-violating

### P0-1. `not-found.tsx` is an unstyled inline-style English page

`src/app/[locale]/not-found.tsx:10-23`
The 404 renders raw `<h1>404 - Page Not Found</h1>` with `style={{ padding:'40px', fontFamily:'system-ui' }}`, English copy, no Navigation, no Footer, no design system, no serif, no localization. On a Russian-default Kazakhstan platform this is jarring and off-brand. (Note the screenshot at `notfound-desktop.png` actually shows a Next.js runtime "Missing <html> and <body> tags in the root layout" overlay — this not-found is also structurally broken because a localized not-found needs the html/body shell.)
**Fix:** Replace with a branded page — Navigation + Footer, `font-serif` headline, ink/gold treatment, localized via `useTranslation`, gold or black CTA back to `/${locale}`. Effort: **S**.

### P0-2. All three listing cards link to a locale-less, broken detail route

`src/components/cards/MiningLicenseCard.tsx:47`, `MineralOccurrenceCard.tsx:44`, `ExplorationLicenseCard.tsx:44` — all `<Link href={`/listings/${deposit.id}`}>` with **no `/${locale}` prefix**. Combined with the dual-ORM drift (detail reads Prisma=empty, catalog reads Supabase=real), every card click lands on "Объявление не найдено" (`listing-detail-desktop.png`). This is the single worst UX path: the catalog looks alive, every click dies.
**Fix:** Prefix locale and fix the detail data source (covered by the data-layer P0). Card-side change: `href={`/${locale}/listings/${deposit.id}`}`. Effort: **S** (card side) / **M** (full fix with ORM).

### P0-3. Emoji used as section headings on the lead teaser

`src/app/[locale]/leads/[code]/page.tsx:114` (`📊 Чем подтверждена ценность`), `:174` (`✅ Юридический статус`), `:166` (`⚖️ Все цифры…`). Direct violation of the design law ("Icons: Lucide React only. NO emoji in UI"). Emoji also breaks structured-data/SEO parsing per CLAUDE.md SEO rule 7. Visible in `lead-teaser-desktop.png` / `lead-teaser-mobile.png`.
**Fix:** Swap for Lucide (`BarChart3`, `ShieldCheck`/`Scale`, `Gavel`) inline with the h2, sized `w-4 h-4 text-gold-dark`. Effort: **S**.

---

## P1 — Heavy design: editorial system does not propagate

### P1-1. Zero serif typography on any internal page

`grep font-serif` → only `PortalWelcomeHero.tsx` + `AudienceSection.tsx`. Every internal h1/h2 is `font-bold`/`font-semibold` sans:

- `/leads` h1 `text-3xl lg:text-4xl font-bold` (`leads/page.tsx:66`)
- `/listings` h1 `text-2xl font-semibold` (`listings/page.tsx:175`)
- lead teaser h1 `text-2xl lg:text-3xl font-bold` (`leads/[code]/page.tsx:99`)
- card titles `text-base font-semibold` (`LeadCard.tsx:60`, `card.tsx:38`)
  The homepage promises an editorial register; the catalogs read like a generic SaaS dashboard. **The single highest-leverage change in this audit.**
  **Fix:** Introduce a `.font-serif` page-title convention. Page h1 → `font-serif font-light text-4xl lg:text-5xl tracking-tight`; section h2 → `font-serif text-xl/2xl`. Apply to `/leads`, `/listings`, lead teaser, listing detail. Effort: **M**.

### P1-2. Prices are sans-bold, not serif — the money never feels editorial

The hero renders stat numbers in `font-serif text-3xl text-gold-light` (`PortalWelcomeHero.tsx:249`). Internal prices are plain sans:

- LeadCard price `text-sm font-bold text-gold-dark` (`LeadCard.tsx:94`)
- teaser price `text-2xl font-bold text-gold-dark` (`leads/[code]/page.tsx:227`)
- ExplorationLicenseCard price `text-lg font-bold text-gray-900` (`ExplorationLicenseCard.tsx:91`) — not even gold, just gray.
  Prices are the emotional payload of a marketplace; they should be the most editorial element.
  **Fix:** Price → `font-serif text-2xl text-gold-dark dark:text-gold-light tabular-nums`. Standardize gold across all card variants. Effort: **S/M**.

### P1-3. Listing cards are a blue/gray system, contradicting the gold brand

`ExplorationLicenseCard.tsx`: mineral icon `text-[#0A84FF]` (:49), mineral pill `bg-[#0A84FF]/10 text-[#0A84FF]` (:77), "Проверено" badge `variant="blue"` (:58), price gray (:91). `ListingCard.tsx:16` status color `bg-blue-100 text-blue-800`. The listings catalog (`listings-desktop.png`) is visibly blue-on-white while leads (`leads-desktop.png`) are gold-accented — two different brands in one product. Blue is meant as a _sparing_ accent, not the dominant card color.
**Fix:** Align listing cards with LeadCard's gold language: gold gem/mineral icon, gold or neutral mineral pill, `hover:border-gold/60`, serif gold price. Reserve blue for genuine links only. Effort: **M**.

### P1-4. LeadCard vs ListingCard are two unrelated card designs

LeadCard (`LeadCard.tsx`): `h-36` gradient header, gold gem, `hover:border-gold/60`, flex-col h-full, `Lock + "Открыть"` CTA. ExplorationLicenseCard: `h-48` header, blue icon, `hover:border-gray-300`, no h-full equalization, a `ShowInterestButton`. Different heights, hover colors, footer layouts. Side-by-side they look like two products.
**Fix:** Extract a shared `BaseListingCard` shell (header height, hover, footer rhythm, serif price) and let lead/listing variants fill content. Effort: **M/L**.

### P1-5. Catalog hero bands are thin and generic vs the homepage hero

`/listings` header is a flat white band `py-6` with a `text-2xl font-semibold` h1 (`listings/page.tsx:171-191`) — no eyebrow, no atmosphere, no serif. `/leads` is better (gold eyebrow pill at :62) but still sans h1 and no editorial texture. After the cinematic `PortalWelcomeHero`, both feel like a downgrade.
**Fix:** Give catalog heroes a shared editorial header: gold eyebrow pill + serif h1 + muted subtitle + thin gold/ink divider. Optionally a faint contour/ink wash on a short band. Effort: **M**.

### P1-6. `LeadLockedSection` blur teaser is grey filler, not a conversion moment

`leads/[code]/page.tsx:201` + `lead-teaser-desktop.png`: the locked "Что откроется после доступа" block is rows of solid grey bars — reads as broken/empty rather than as desirable hidden value. The whole teaser→full conversion hinges on this block feeling like a vault.
**Fix:** Replace grey bars with realistic blurred/redacted text (`blur-sm select-none`), a gold `Lock` motif, and a gold-accented "unlock" affordance tied to the sidebar CTA. Effort: **M**.

### P1-7. Listing detail page has no editorial treatment at all

The only listing detail currently reachable renders the 404 (`listing-detail-desktop.png`), but the page that _should_ render (per grounding facts, a generic Tailwind page) has none of the gold/serif system. When the data P0 is fixed, the detail page will be the deepest funnel point and must carry the brand.
**Fix:** When rebuilding the detail route, apply the same serif-h1 / gold-price / ink-section system as the lead teaser sidebar. Effort: **L** (paired with data fix).

---

## P2 — Polish: states, consistency, rhythm

### P2-1. Filter sidebar is generic; selects have no focus ring or gold accent

`leads/page.tsx:98-140`: native `<select>`/checkbox with `bg-transparent`, no `focus-visible` ring, no gold focus state. Radios in `listings-desktop.png` are default blue browser radios. Inconsistent with the polished hero.
**Fix:** Standardize inputs: `focus-visible:ring-2 focus-visible:ring-gold/40`, gold-checked accents (`accent-gold` on checkboxes/radios). Effort: **S/M**.

### P2-2. Button focus ring color is undefined → defaults to browser/transparent

`button.tsx:8` uses `focus-visible:ring-2 focus-visible:ring-offset-2` but **no `ring-*` color**, so the ring is the Tailwind default (currentColor-ish) and inconsistent across variants. Badge (`badge.tsx:5`) references `ring-ring` which isn't a defined token in this Tailwind config.
**Fix:** Add explicit `focus-visible:ring-gray-900 dark:focus-visible:ring-gray-100` (or `ring-gold/50` for accent). Replace `ring-ring` with a real color. Effort: **S**.

### P2-3. Cards lift on hover but don't move on active/press; no tactile feedback

LeadCard/Exploration cards have `hover:-translate-y-0.5` (`LeadCard.tsx:28`) but no `active:` state and no `active:translate-y-0`. On touch (mobile) the lift never triggers, so mobile cards feel inert.
**Fix:** Add `active:translate-y-0 active:shadow-subtle` and consider `active:scale-[0.99]` for touch feedback. Effort: **S**.

### P2-4. Hardcoded Russian copy on supposedly multilingual pages

`leads/page.tsx` is entirely hardcoded RU ("Свободные участки с золотом" :67, "Фильтры" :91, "Все регионы" :103, etc.). `listings/page.tsx` error/empty states hardcoded RU (:255 "Ошибка загрузки", :315 "Ничего не найдено"). lead teaser fully hardcoded RU. In en/zh locale these render Russian — a visible quality break.
**Fix:** Route through `useTranslation`/server t(). Effort: **M** (lots of strings, but mechanical).

### P2-5. Inconsistent empty-state design across pages

`/leads` empty: dashed border + `FileSearch` icon + blue link (`leads/page.tsx:173-181`). `/listings` empty: no border, `Search` icon + Button (`listings/page.tsx:311-323`). Two visual languages for the same concept.
**Fix:** One `<EmptyState icon title body action />` component, gold-tinted icon, used everywhere. Effort: **S/M**.

### P2-6. Pagination is two different components

`/leads` uses text links "← Назад / Вперёд →" with literal arrow glyphs (`leads/page.tsx:194-211`); `/listings` uses `Button` + `ChevronLeft/Right` + numbered pages (`listings/page.tsx:329-392`). Inconsistent and the leads arrows are unicode glyphs not Lucide.
**Fix:** Shared `<Pagination>` using Lucide chevrons and Button. Effort: **M**.

### P2-7. Status text/colors hardcoded and duplicated

`ListingCard.tsx:13-37` hardcodes RU status text + `bg-blue-100` colors, while `ExplorationLicenseCard.tsx:21-32` independently maps the same statuses to badge variants. Two sources of truth, one of them off-palette (blue for ACTIVE).
**Fix:** Single status→{label,variant} map; ACTIVE → `success` (green) or gold, never raw blue-100. Effort: **S**.

### P2-8. `Card` primitive has no hover lift; cards re-implement it ad hoc

`card.tsx:11` has `transition-all duration-200` but no hover transform, so every consumer re-adds `hover:-translate-y-0.5 hover:shadow-medium` by hand (LeadCard, all listing cards). Drift guaranteed.
**Fix:** Add an `interactive` variant to Card with the canonical hover. Effort: **S**.

---

## P3 — Nice-to-have / brand depth

### P3-1. Design-system violations inside the reference hero itself

`PortalWelcomeHero.tsx:154,5` uses the `Sparkles` icon (the design law explicitly forbids "sparkle badges"), `:179` uses `animate-ping`, `:152` a glow `hover:shadow-[0_0_30px_...]`. The hero is the brand anchor but technically breaks two stated rules. Low urgency (it looks good) but worth reconciling the written law with reality.
**Fix:** Swap `Sparkles` for `ArrowRight`/`Gem`; decide whether the glow/ping are sanctioned and update CLAUDE.md, or remove them. Effort: **S**.

### P3-2. No `prefers-reduced-motion` guard on hero entrance animations

`PortalWelcomeHero.tsx:118-225` runs `qzFadeUp` on 6 elements via inline `animation`; no `@media (prefers-reduced-motion: reduce)` fallback. Accessibility + the design law's "reduced-motion" intent.
**Fix:** Wrap keyframe usage in a reduced-motion media query (set `opacity:1; transform:none`). Effort: **S**.

### P3-3. Mobile bottom-nav overlap handled by a magic margin

`Footer.tsx:30` `mb-14` hard-codes space for a mobile bottom bar. Fragile coupling; if the bar height changes the footer breaks. Visible whitespace at bottom of mobile screenshots.
**Fix:** Use a CSS var / safe-area inset shared with the bottom nav. Effort: **S**.

### P3-4. Theme toggle buried in footer; no nav-level dark-mode affordance

`Footer.tsx:147` is the only `ThemeToggle`. Users must scroll to the footer to switch themes — discoverability is poor, and the moon glyph in mobile screenshots floats with no label.
**Fix:** Add a compact theme toggle to Navigation right-cluster. Effort: **S**.

### P3-5. Map view-toggle and "Список/Карта" pills are generic gray, not branded

`listings/page.tsx:213-236` toggle uses `bg-gray-100`/`bg-white` active state. Fine, but a thin gold active underline or gold text on active would tie it to the system. Effort: **S**.

### P3-6. Lead teaser "Расположение" map placeholder is a flat gradient box

`leads/[code]/page.tsx:208-216`: grey gradient box with a grey pin. Reads as a missing map. A subtle ink/contour texture (reuse the hero's SVG contour pattern) would make "coordinates hidden" feel intentional and premium rather than unfinished. Effort: **M**.

---

## How the editorial system should propagate (concrete tokens)

1. **Serif title convention** — add to a shared component / class: page h1 `font-serif font-light text-4xl lg:text-5xl tracking-tight`, section h2 `font-serif text-xl`. Apply on `/leads`, `/listings`, teaser, detail.
2. **Serif gold price** — everywhere money renders: `font-serif text-2xl text-gold-dark dark:text-gold-light tabular-nums`.
3. **Gold over blue in cards** — replace `text-[#0A84FF]` icons/pills in listing cards with `text-gold`; keep blue only for true links.
4. **Shared `BaseListingCard`** — one shell (header height, `hover:border-gold/60 hover:-translate-y-0.5 active:translate-y-0`, footer rhythm) for lead + listing variants.
5. **Editorial catalog hero** — gold eyebrow pill + serif h1 + muted subtitle + thin `border-b border-gold/20`.
6. **Focus discipline** — `focus-visible:ring-2 ring-gold/40` on inputs, explicit ring color on Button, `accent-gold` on native controls.
7. **Branded 404 + shared EmptyState + shared Pagination** to kill the three biggest consistency gaps.

## Severity counts

P0: 3 · P1: 7 · P2: 8 · P3: 6
