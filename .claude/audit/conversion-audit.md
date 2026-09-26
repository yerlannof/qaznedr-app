# Conversion / Business Audit — QAZNEDR.KZ

Scope: the core funnel **browse leads → view teaser → request unlock → admin grants access**, plus the secondary listings funnel. Static analysis of `src/app/[locale]/page.tsx`, `leads/page.tsx`, `leads/[code]/page.tsx`, `leads/[code]/full/page.tsx`, `LeadUnlockForm.tsx`, `LeadLockedSection.tsx`, `ContactReveal.tsx`, `cards/LeadCard.tsx`, `LeadsHomeHero.tsx`, `PortalWelcomeHero.tsx`, plus teaser/catalog screenshots.

The funnel mechanics are actually well-built: the teaser clearly lists what's locked, the sidebar lists "what's in the full pack," watermarking + audit on the full page is real trust infrastructure, and the gating UX (login → request → grant) is coherent. The gaps are at the **belief layer** — the page never answers the two questions a first-time buyer has before paying: _"Это законно?"_ (is buying a state-archive geological lead legal?) and _"Что именно я получаю за миллион тенге, и что мне с этим делать?"_ There is also zero social proof, the trust/info footer links 404, and the parallel **listings funnel is entirely dead** (P0, owned by the bug auditor but it removes one of two homepage CTAs).

---

## P0 — Funnel-breaking

### P0-1. Listings funnel is dead end → kills one of the two primary homepage CTAs

- **Location:** homepage `PortalWelcomeHero.tsx:158-164` (CTA "ctaListings" → `/[locale]/listings`), and the broken `/[locale]/listings/[id]` detail route (confirmed: renders "Объявление не найдено" for IDs the catalog returns).
- **Issue:** The hero offers two equal CTAs — leads and listings. The listings path leads to a catalog whose detail pages 404 due to Prisma/Supabase ORM drift. A user who clicks the second primary CTA hits a wall. Two of two listings (Кудер, Найзатас) are unreachable. This silently halves the perceived inventory and burns trust on first click.
- **Fix:** Fix the detail route to read Supabase (tracked by bug auditor as P0). **Conversion-side:** until fixed, demote the listings CTA to a secondary text link, or point it at the leads catalog. Do not present a 404-bound path as a co-equal primary CTA.
- **Effort:** M (route fix) / S (demote CTA as interim)

---

## P1 — High-conversion / trust gaps

### P1-1. No answer to "это законно?" anywhere in the funnel — the #1 unspoken objection

- **Location:** `leads/[code]/page.tsx` (teaser), entire flow. There is a "Юридический статус" section (`:172-198`) but it only states the _site_ is free in the registry — it never addresses whether **the buyer purchasing/using the lead is legal**.
- **Issue:** The product is "closed geological leads from state archives." A serious prospector's first thought is "am I buying stolen state data / will my claim be valid?" The page asserts legitimacy ("из государственного первоисточника") but never explains the legal model: that the data is public-archive-derived, that the buyer still files their own недропользование application, that QAZNEDR sells research/navigation not a license. Without this, the high-intent user stalls right before the CTA.
- **Fix:** Add a short "Как это работает легально" block to the teaser (3-4 sentences) and a dedicated FAQ. Cover: source legality, that the buyer files their own application, what QAZNEDR is/ isn't selling.
- **Effort:** M

### P1-2. No FAQ page and no FAQPage JSON-LD

- **Location:** none exists — `grep` for FAQ/FAQPage across `src/app` + `src/components` returns zero. No `/faq`, `/about`, `/support` routes.
- **Issue:** The objections "что за миллион?", "это законно?", "что если участок окажется занят?", "вернёте ли деньги?", "почему координаты скрыты?" have no home. FAQ is the single highest-leverage conversion asset for a trust-gated paid product, and FAQPage structured data wins SERP real estate (directly relevant to a platform that markets its SEO discipline).
- **Fix:** Create `/[locale]/faq` (or a FAQ section on the teaser + leads catalog) answering 6-8 objections; emit `FAQPage` JSON-LD; add to `sitemap.ts`; link from teaser sidebar and footer.
- **Effort:** M

### P1-3. Footer trust/info links 404 (about, support, legal/terms)

- **Location:** `Footer.tsx:100` → `/[locale]/about`, `:108` → `/[locale]/support`, `:116` → `/[locale]/legal/terms`. None of these routes exist (`find` confirms no `about`/`support`/`legal` dirs under `src/app/[locale]`).
- **Issue:** For a product asking strangers to pay ~1M ₸ for invisible data, "О платформе", "Контакты", and "Правила" are exactly the links a cautious buyer clicks to verify the company is real before paying. All three 404. This is a direct trust kill at the decision moment and also damages SEO/structured-data credibility.
- **Fix:** Build real `/about` (mission, who's behind it, why the data is legitimate), `/support` (contact + how purchase works), `/legal/terms`. Even minimal pages beat 404s. Add to sitemap.
- **Effort:** M

### P1-4. Zero social proof / anonymized cases

- **Location:** entire funnel — teaser sidebar `leads/[code]/page.tsx:221-262`, homepage, leads catalog. `PortalWelcomeHero.tsx:209-226` has a generic 4-item "trust strip" but no evidence.
- **Issue:** No "X наводок передано", no anonymized success story ("старатель из Жамбылской вышел на точку по AU-#"), no testimonial, no "проверено N раз". A new marketplace with 31 leads and 2 listings reads as empty/risky. Buyers convert on proof that _someone else already paid and it worked_.
- **Fix:** Add an anonymized cases / "как это сработало" section (even 1-2 real or representative cases, clearly labeled), plus a count of delivered leads if available. Keep copy factual per design system — no hype.
- **Effort:** M

### P1-5. Teaser never states the price clearly _before_ the CTA, and "от 1 000 000 ₸" raises more questions than it answers

- **Location:** teaser sidebar `leads/[code]/page.tsx:223-249`. Price shows as `lead.price_display` ("от 1 000 000 ₸" in screenshot) with subtitle `EXCLUSIVITY_LABELS[...]` ("Массовый доступ"), then CTA "Получить полные данные".
- **Issue:** "от" (from) implies the price can go up — buyer can't tell what they'll actually pay. "Массовый доступ" (non-exclusive) is presented as a feature but undercut value perception (others can buy the same lead) with no explanation of why that's fine. There's no "что входит в цену" tied to the number, no refund/guarantee language. The CTA "Получить полные данные" promises instant delivery, but the flow is actually login → manual request → admin grant (async). Expectation mismatch.
- **Fix:** Replace "от X" with the actual price or a clear "fixed price" label; explain exclusivity tier in one line; align CTA copy with the real async flow (e.g. "Запросить полные данные" not "Получить"); add a one-line "что входит / гарантия" near the price.
- **Effort:** S

### P1-6. Unlock-request form drops the buyer into an async black hole with no expectation-setting

- **Location:** `LeadUnlockForm.tsx:54-66` success state, and `full/page.tsx:47-79` "Доступ ещё не открыт" screen.
- **Issue:** After submitting, the user sees "Заявка отправлена · Свяжемся с вами" — no timeframe ("в течение 24ч"), no channel (звонок? email? whatsapp?), no payment step explained, no price confirmation, no "что дальше". For a paid transaction this ambiguity is where intent dies. The "Получить полные данные" CTA also leads to `/full`, which (for non-entitled users) is the same request form again — a confusing loop where the teaser CTA and the form both lead to "request," with no clear single path.
- **Fix:** In the success state, state the next step + timeframe + how payment happens. Consolidate so the teaser CTA and the full-page gate present one consistent "request access" action. Consider a visible step indicator (Заявка → Согласование → Оплата → Передача).
- **Effort:** M

### P1-7. Design-system violations: emoji in teaser section headings

- **Location:** `leads/[code]/page.tsx:114` `📊 Чем подтверждена ценность`, `:166` `⚖️ Все цифры...`, `:174` `✅ Юридический статус`.
- **Issue:** CLAUDE.md design rules explicitly forbid emoji in UI (use Lucide; also matters for structured-data/SEO parsing). These appear on the highest-intent page in the funnel and cheapen the "serious, verified" trust positioning the product depends on.
- **Fix:** Replace with Lucide icons (BarChart3, Scale, CheckCircle2 — already imported in the file).
- **Effort:** S

### P1-8. Catalog hero claims "с золотом" but funnel is gold-only with no breadth signal; "Найдено: 31" is the only quantity cue

- **Location:** `leads/page.tsx:66-79`.
- **Issue:** H1 "Свободные участки с золотом" hard-codes gold, yet the type filter and minerals suggest broader ambition. More importantly, the hero buries the value prop in dense prose (`:69-73`) and the only conversion-relevant number ("Найдено: 31") is small gray text. There's no "почему именно мы" / differentiation above the grid, and no entry CTA — the user must understand the filters to proceed.
- **Fix:** Tighten hero to one factual value line; surface the count + "all verified against state registry" as a confidence stat; consider a "как это работает" 3-step strip above the grid (mirrors homepage but at point of intent).
- **Effort:** S

---

## P2 — Polish / conversion friction

### P2-1. Empty state is a dead end, not a conversion moment

- **Location:** `leads/page.tsx:172-182` ("Ничего не найдено" + reset link).
- **Issue:** When filters return nothing, the only action is "Сбросить фильтры." No "оставить заявку на участок в этом регионе" lead-capture, no "уведомить когда появится." A filtered-to-zero user is high-intent (they know what they want) and is let go.
- **Fix:** Add a "не нашли нужное? оставьте запрос — сообщим о новых наводках в регионе" capture in the empty state. Turns a dead end into a lead.
- **Effort:** S

### P2-2. CTA wording inconsistency across the funnel

- **Location:** teaser CTA "Получить полные данные" (`:243`), full-page button "Оставить заявку"/"Войти и оставить заявку" (`LeadUnlockForm:88-92`), card CTA "Открыть" (`LeadCard` via `leadCard.open`), homepage "Смотреть наводки".
- **Issue:** Three different verbs for the same intent (получить / оставить заявку / открыть) make the path feel inconsistent and the commitment level unclear. Design system wants short, factual, consistent.
- **Fix:** Standardize on one request verb pair: card "Открыть тизер" → teaser "Запросить доступ" → form "Отправить заявку". Consistency reduces hesitation.
- **Effort:** S

### P2-3. "Стоимость наводки" card lacks a guarantee/risk-reversal line

- **Location:** `leads/[code]/page.tsx:223-249`.
- **Issue:** No risk reversal anywhere (refund if site turns out occupied? accuracy guarantee?). For an invisible, non-refundable-feeling digital product, a single risk-reversal line materially lifts conversion.
- **Fix:** Add one factual guarantee line if the business supports it (e.g. "Координаты проверены на дату X; при расхождении — замена/возврат"). If no guarantee exists, that's a business decision to surface.
- **Effort:** S

### P2-4. `ShowInterestButton` / `ContactReveal` (listings funnel) duplicate yet diverge from the leads unlock pattern

- **Location:** `cards/ShowInterestButton.tsx`, `ContactReveal.tsx` (blue `#0A84FF` reveal button at `:86`).
- **Issue:** Listings use a "reveal contacts" model (instant, blue button) while leads use "request access" (async, black button). Two different trust/payment mental models on one platform confuse the user about how QAZNEDR actually works. Also `ContactReveal` uses a blue primary button — design system says primary buttons are black, blue is accent only.
- **Fix:** If listings stay, align their CTA model + button color with the leads pattern. (Lower priority since listings funnel is currently broken — P0-1.)
- **Effort:** M

---

## P3 — Nice-to-have

### P3-1. No urgency / scarcity signal despite "Массовый доступ vs эксклюзив" model existing

- **Location:** `EXCLUSIVITY_LABELS` usage `:231`.
- **Issue:** Exclusivity tier is shown but never leveraged for urgency ("1 эксклюзивный доступ — после продажи закрыто"). Factual scarcity (already in the data model) is unused.
- **Fix:** For exclusive tiers, add a factual "осталось: эксклюзив" line. Keep honest, no fake countdowns.
- **Effort:** S

### P3-2. Map placeholder uses gradient background (design-system grey area) and adds no conversion value

- **Location:** `leads/[code]/page.tsx:208` (`bg-gradient-to-br`), `LeadCard.tsx:30`, `:223` sidebar.
- **Issue:** Gradients are discouraged by the design system; the "Расположение" placeholder only restates the region already shown above. Low value, mild rule friction.
- **Fix:** Replace gradient with flat surface; consider a blurred region-level map outline to add real "you're getting a real place" signal instead of an empty box.
- **Effort:** S

### P3-3. Homepage "How it works" steps describe a sell/post flow, not the buy-a-lead flow users are actually in

- **Location:** `page.tsx:14-33` (Register → Post → Partner) vs the dominant funnel (browse leads → request → receive).
- **Issue:** The homepage leads with the leads showroom, but "Как это работает" explains posting listings — a mismatch with the primary buyer journey.
- **Fix:** Either split into two clearly-labeled flows (для покупателя / для продавца) or lead with the buyer flow that matches the hero.
- **Effort:** S
