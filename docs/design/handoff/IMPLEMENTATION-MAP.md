# Handoff: implementation map

Status: design handoff for later implementation. The owner has approved brand direction A3 + D2 and the eight-page structure in `APPROVED.md`. **Pages 03–06, their visual treatments, content details, and component states remain proposals pending owner approval.** Do not treat this package as production approval.

## Page and component mapping

| Proposed page  | Preview / expected route                      | Main pieces to implement                                                                                                    | Key behavior                                                                               |
| -------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Home (03)      | `site-preview.html?screen=home` / `/`         | Header, hero, factual stats, geology scene, portfolio teaser, cooperation/process, team, trust, guides, contact CTA, footer | Locale/theme; scene may be static until a single approved layered asset exists.            |
| Portfolio (04) | `?screen=portfolio` / `/portfolio`            | Intro, metal/type/region filters, result count/empty state, project cards, contact CTA                                      | Filters and reset; mobile filter panel closes on Escape and restores focus.                |
| Teaser (04)    | `?screen=teaser&code=…` / `/portfolio/[slug]` | Open facts, NDA materials, contact options, backup form, transaction formats, verification/legal note                       | Carry the real project slug/code into contact context; represent each status clearly.      |
| Services (05)  | `?screen=services` / `/services`              | Four service sections: licensing support, field work, due diligence, analysis                                               | Topic CTA carries selected service into contact. Avoid outcome/timing guarantees.          |
| About (05)     | `?screen=about` / `/about`                    | Geologists’ method, real team profiles, legal entity, official verification links                                           | 7,000+ describes the archival database, not owned assets or portfolio count.               |
| Contact (05)   | `?screen=contact` / `/contact`                | Locale-prioritized messenger, email, response hours/languages, inquiry form                                                 | WeChat first for 中文; WhatsApp first for RU/EN. Hide unconfigured channels in production. |
| Insights (06)  | `?screen=insights` / `/insights`              | Topic/language filters and editorial cards                                                                                  | Filter actual published items; empty state/reset.                                          |
| Article (06)   | `?screen=article` / `/insights/[slug]`        | Short answer, anchored contents, body, table, sources, related contact                                                      | Sources require editor-verified titles, links and checked dates.                           |
| Metal hub (06) | `?screen=metal` / `/metals/[slug]`            | Intro, relevant project cards/table, context, FAQ, contact                                                                  | Only show verified portfolio records; no price/resource forecasts without sourced review.  |

The preview combines routes in one HTML file selected by query parameter; these route names are implementation suggestions, not approved URL/SEO decisions. The typographic wordmark in the earlier site preview is a placeholder. A vector candidate is supplied in `../brand/candidate-v1/`; exact geometry and lettering await approval. The proposed local type pair and licenses are in `../brand/fonts/`. Do not replace an approved logo with a convenient body font.

## Shared components and supplied assets

Use shared header/menu, locale/theme controls, CTA, filter controls, project card, status badge, teaser detail table, contact channel, form, notice/legal note, article table/TOC, and footer. Use Lucide UI icons only. Apply tokens/states from `../brand/brand.md`.

Image references: `../mockups/01/elements/geology-cutaway.png` (home), `archive-to-field.png` (method/services), `portfolio-specimens.png` (portfolio/metal). They are generated illustrative art, not evidence, real samples, or project photography. Page-level compositions are listed in `../ASSETS.md`; responsive WebP renditions at 640/960/1440 are supplied in `../brand/web-assets/` with dimensions, hashes, and source mapping. Reserve image dimensions during implementation. Do not copy incidental generated labels/icons.

## Prototype audit (read-only)

The Insights content-language filter was corrected during continuation: it filters demonstration records independently of the header’s global UI-language selector. Topic and language combine, with result count and empty/reset behavior. Twelve targeted RU/EN/ZH × light/dark × 375/1440 checks passed; report: `../mockups/site-preview/qa-insights-filter.json`. Demonstration language availability is not a real editorial inventory.

The prototype’s form intentionally reports that no data was sent; keep that wording in the preview only. Its WeChat/WhatsApp/email values and QR are placeholders and copy is disabled (line 6); production needs real approved contacts and must omit unavailable channels. Project examples are demonstrations only; do not migrate their DEMO codes as real records. Other reviewed interactions (menu/filter close and focus return, code retention, localized topic context, theme/language query controls) are represented in the adjacent QA notes, not proof of production behavior.
