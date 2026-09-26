# Accessibility Audit (WCAG 2.1 AA) — QAZNEDR.KZ

Scope: static analysis of `src/components`, `src/app`, `src/styles/globals.css`, plus visual contrast read from `.claude/audit/screenshots`. Contrast ratios computed with the WCAG relative-luminance formula.

Legend: P0 = blocks a user group / legal-grade barrier, P1 = clear AA failure affecting core flows, P2 = polish, P3 = nice-to-have. Effort: S < 30 min, M ~1–3 h, L > 3 h.

---

## 1. Zoom disabled globally — WCAG 1.4.4 (P0)

`src/app/[locale]/layout.tsx:64-70`

```ts
export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
  ...
};
```

`userScalable: false` + `maximumScale: 1` prevents pinch-zoom on every page. This is a hard WCAG 2.1 **1.4.4 Resize Text (AA)** failure and **1.4.10 Reflow** risk. Low-vision users cannot magnify. This is the single most impactful a11y defect because it is global.

**Fix:** remove `maximumScale` and `userScalable` (keep `width`, `initialScale`, `viewportFit`). Effort: **S**.

---

## 2. No skip-to-content link — WCAG 2.4.1 (P1)

No "Skip to main content" link exists anywhere (grep for `skip` in `src/app`/`src/components` returns only unrelated matches). Keyboard/SR users must tab through the full fixed `Navigation` (6 nav links + auth) on every page before reaching content.

**Fix:** add a visually-hidden-until-focused anchor as the first focusable element in `src/app/[locale]/layout.tsx` body, pointing at `#main`, and add `id="main"` to the `<main>` wrappers (e.g. `leads/page.tsx:59`). A `.sr-only focus:not-sr-only` utility class is needed (not currently defined). Effort: **S**.

---

## 3. Missing `<main>` landmark + duplicate unlabeled `<nav>` landmarks (P1)

- `src/app/[locale]/layout.tsx:110` wraps children in a plain `<div className="pb-16 md:pb-0">` — there is **no `<main>` landmark at the layout level**. Some pages add their own `<main>` (`leads/page.tsx:59`) but it is inconsistent, so the homepage (`PortalWelcomeHero` + sections) renders with no `main` landmark at all.
- Two `<nav>` elements (`Navigation.tsx:71` and `MobileTabBar.tsx:34`) both lack `aria-label`, so a screen reader announces "navigation" twice with no way to distinguish them (WCAG 1.3.1 / 4.1.2).

**Fix:** wrap `{children}` in `<main id="main">` in the locale layout (and remove the redundant per-page `<main>` or keep only one). Add `aria-label` to each nav: `Navigation` → "Основная навигация", `MobileTabBar` → "Мобильная навигация". Effort: **S**.

---

## 4. Icon-only / menu buttons missing ARIA — WCAG 4.1.2 (P1)

Across the codebase only **7 `aria-label`s and 0 `aria-expanded`/`aria-haspopup`/`aria-pressed`/`aria-current`** exist (grep-confirmed). Concrete gaps:

- **Hamburger menu** `Navigation.tsx:180-182` — `<button>` wrapping a bare `<Menu>` icon, no `aria-label`. SR announces "button" with no name.
- **User-menu trigger** `Navigation.tsx:113-121` — icon+chevron button with no `aria-label`, no `aria-expanded={userMenuOpen}`, no `aria-haspopup="menu"`. The dropdown (`:123`) is a custom `useState` menu (not Radix), so it has **no focus management, no roving tabindex, no Escape handler, no `role="menu"`**.
- **Favorite toggle** `unified-listing-card.tsx:55-68` — icon-only heart `Button` with no `aria-label` and no `aria-pressed={isFavorite(...)}`; toggle state conveyed by color only (also a 1.4.1 use-of-color issue).
- **ThemeToggle** `ThemeToggle.tsx:19-23` — has `aria-label="Toggle theme"` (good) but it is hard-coded English on a RU-default site and the inline `<svg>` has no `aria-hidden`.

**Fix:** add `aria-label` (localized) to every icon-only button; add `aria-expanded`/`aria-haspopup` to the user-menu trigger and ideally replace the hand-rolled dropdown with the existing Radix primitive for focus trap + Escape; add `aria-pressed` to the favorite button. Effort: **M**.

---

## 5. Decorative icons not hidden from SR — WCAG 1.3.1 (P2)

Only 3 `aria-hidden` attributes exist in the whole app, yet Lucide icons are used decoratively in dozens of places (e.g. `LeadCard.tsx:33,39,47,98,100`; `PortalWelcomeHero.tsx:154,156,162`; `leads/page.tsx:63,91,174`; badge icons). Lucide renders `<svg>` with no `aria-hidden` by default, so SRs may announce empty graphics or, worse, when an icon sits next to text the SR reads noise. The decorative SVG layers in `PortalWelcomeHero` are correctly wrapped in `aria-hidden` (`:39`) — good pattern to replicate.

**Fix:** add `aria-hidden="true"` (or `focusable="false"`) to all purely decorative Lucide icons. Where an icon is the _only_ content of an interactive element, give the element an `aria-label` instead. Effort: **M** (broad but mechanical).

---

## 6. Form controls without programmatic labels — WCAG 1.3.1 / 3.3.2 (P1)

- **`LeadUnlockForm.tsx:70-82`** — the `<textarea>` and phone `<input>` have **only `placeholder`**, no `<label>`, no `aria-label`, no `id`. Placeholder is not an accessible name and disappears on input. This is the platform's primary conversion form (request lead access).
- **`leads/page.tsx:94-151`** — filter `<label>`s ("Регион", "Тип", "Сортировка") are **sibling elements, not associated** via `htmlFor`/`id` to their `<select>`s. The "Только свободные" checkbox label (`:142`) _does_ wrap its input (OK). Selects are clickable by mouse but the label is not programmatically tied for SR/voice control.
- **`LanguageSwitcher.tsx:11-21`** — `<select>` has **no label at all** (no visible label, no `aria-label`). SR announces "combobox" with no name.

**Fix:** associate every label/control via `htmlFor`+`id`, or wrap. Add `aria-label="Язык интерфейса"` to the language `<select>`. Add proper labels (visible or `sr-only`) to the unlock form fields. Effort: **M**.

---

## 7. No live regions for async state — WCAG 4.1.3 (P1)

Grep confirms **zero `aria-live`, `role="status"`, or `role="alert"`** in the codebase. Affected async/dynamic surfaces:

- `LeadUnlockForm.tsx:54-66` success panel and `:94-98` error message — appear/replace silently. SR users get no confirmation that "Заявка отправлена" or that submission failed.
- `PortalWelcomeHero.tsx:18-34` live stat counts fetched and swapped in with no announcement (minor, but the "LIVE" label implies updates).
- `sonner` Toaster (`layout.tsx:112`) — sonner does render an `aria-live` region internally, so toasts are OK; but the in-form states above are not toasts.

**Fix:** wrap the unlock-form result/error in `<div role="status" aria-live="polite">` (error → `role="alert"`/`aria-live="assertive"`). The submit button text change ("Отправка…") should also be reflected with `aria-busy`. Effort: **S**.

---

## 8. Color-contrast failures — WCAG 1.4.3 (P1/P2)

Computed ratios (normal text needs ≥ 4.5:1; large/bold ≥ 18.66px or bold ≥ 14px needs ≥ 3:1):

| Foreground / background                   | Ratio    | Verdict                             | Where                                                                                                                |
| ----------------------------------------- | -------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| gold `#C8A24B` on white                   | **2.41** | FAIL (any size)                     | `Gem` icon `LeadCard.tsx:33`; gold accents on light cards                                                            |
| gold-light `#E0C674` on white             | **1.68** | FAIL                                | any light-mode gold-light text                                                                                       |
| gold-dark `#A8842F` on white              | **3.50** | FAIL for normal text, OK large only | `leads/page.tsx:62` eyebrow text-xs (FAILS — it is 12px)                                                             |
| gold badge text `#8a6d1f` on its 12% tint | **4.31** | marginal FAIL                       | `badge.tsx:19` gold variant (text-xs)                                                                                |
| blue `#0A84FF` on white                   | **3.65** | FAIL for normal text                | `LeadCard.tsx:97` "Открыть" link (text-xs); `MobileTabBar.tsx:48` active tab `text-[10px]`; pagination links         |
| gray-400 `#9CA3AF` on white               | **2.54** | FAIL                                | `LeadCard.tsx:56,73` meta text; `FileSearch` icon `leads/page.tsx:174`; ~38 `text-gray-400/300` instances in lead UI |
| gray-300 `#D1D5DB` on white               | **1.47** | FAIL                                | `leads/page.tsx:174` empty-state icon                                                                                |
| gray-500 `#6B7280` on ink `#0A0A0A`       | **4.10** | FAIL normal text                    | `PortalWelcomeHero.tsx:201,220` caption/trust desc (text-[12px])                                                     |

Dark-mode gold (gold-light on `#0A0A0A` = **11.78**) and ink-on-gold badge (**8.23**) PASS. The problems are concentrated in **light mode** (gold + blue + light grays) and a few **small grays on the dark hero**.

**Fix:**

- Replace `text-gray-400` with `text-gray-500` (4.83:1 PASS) for any text under ~18px. (S, but many files.)
- The blue `#0A84FF` link/active-tab text is the design-system accent and fails at small sizes — darken to ~`#0060DF` (≈4.6:1) for text use, or only use `#0A84FF` for ≥18.66px / non-text. (M, design-token decision.)
- gold-dark eyebrow on white (`leads/page.tsx:62`) at 12px: bump weight to bold + size, or darken to `#7A5F1A`. (S)
- `PortalWelcomeHero` `text-gray-500` captions on ink → use `text-gray-400` (7.8:1) instead. (S)

Effort overall: **M**.

---

## 9. Focus-visible ring tokens may be invisible (P2)

`globals.css:293-296` defines a solid `:focus-visible { outline: 2px solid #0a84ff }` globally — **good baseline**. However several components override with `focus:ring-ring` / `ring-offset-background` (`sheet.tsx:75`, `badge.tsx:5`) and `focus-visible:ring-2 focus-visible:ring-offset-2` **without specifying a ring color** (`button.tsx:8`). Tailwind's default ring color is a blue, but these utilities rely on CSS vars (`--ring` = `oklch(0.708 0 0)`, a mid-gray ≈ low contrast) that are wired through shadcn tokens not fully present in this Tailwind config. Net effect: the global outline likely still shows, but the per-component ring offsets can produce a faint/low-contrast ring, especially the `--ring` gray on white. Worth verifying the focus indicator meets **WCAG 2.4.11 (focus not obscured)** and 1.4.11 (3:1 against adjacent).

**Fix:** standardize on the global `#0A84FF` outline; or set `--ring` to `#0A84FF`. Remove reliance on undefined `ring-ring`/`ring-offset-background` in `sheet.tsx`. Effort: **S**.

---

## 10. prefers-reduced-motion — mostly respected, two gaps (P2)

`globals.css:299-308` has a solid `prefers-reduced-motion: reduce` block zeroing animation/transition durations and `scroll-behavior`. This correctly neutralizes the `qzFadeUp` entrance animations in `PortalWelcomeHero` (they use `forwards` fill, so they snap to the visible end-state — verified safe; content stays at `opacity:1`).

Gaps:

- **`animate-ping`** on the "LIVE" dot (`PortalWelcomeHero.tsx:179`) is an _infinite_ pulse. The reduced-motion rule sets `animation-iteration-count: 1`, which stops it after one cycle — acceptable, but a continuous ping is exactly the kind of motion 2.3.3/2.2.2 targets; better to disable it entirely under reduced motion.
- `unified-listing-card.tsx:48` and several skeletons use `animate-pulse` (infinite). Same iteration-count mitigation applies, but a static skeleton under reduced motion is cleaner.
- The `.reduce-motion-mobile` class (`globals.css:64-70`) is defined but must be opted-in per element — not applied globally, so it is effectively dormant.

**Fix:** add explicit `motion-reduce:animate-none` to `animate-ping`/`animate-pulse` decorative loops. Effort: **S**.

---

## 11. Heading hierarchy & alt text — largely OK (P3)

- Lead detail `leads/[code]/page.tsx` has a single `h1` (`:99`) then `h2`→`h3` progression (`:113,173,205,252`) — correct.
- Homepage: `PortalWelcomeHero.tsx:128` is the `h1`; verify downstream `LeadsHomeHero`/`AudienceSection` use `h2` (not another `h1`) — spot-check recommended.
- `next/image` usages (`unified-listing-card.tsx:36-46`) include `alt={listing.title}` — good. The `LeadCard` uses a decorative `Gem` icon instead of an image, so no alt needed, but the icon carries the only "type" visual — fine since type is also in text (`:57`).
- `unified-listing-card.tsx:50-54` "Verified" badge and `:88-92` rating star: meaning conveyed by icon+text — OK.

**Fix:** confirm one-h1-per-page on home sections; otherwise no action. Effort: **S**.

---

## Summary of counts

- P0: 1 (zoom disabled)
- P1: 6 (skip link, landmarks/nav labels, icon-button ARIA, form labels, live regions, contrast)
- P2: 3 (decorative icons aria-hidden, focus-ring tokens, reduced-motion gaps)
- P3: 1 (heading/alt verification)

The highest-leverage quick wins (all S effort): remove `userScalable:false`, add skip link + `<main>`, add `aria-label` to the two navs + hamburger + language select, wrap the unlock-form result in `role="status"`, and swap `text-gray-400`→`text-gray-500` for small text.
