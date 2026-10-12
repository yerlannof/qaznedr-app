# Catalogue discovery and demand map — 12.10.2026

Owner asks to improve QAZNEDR after the AnswerThePublic assessment. This package
repairs existing behaviour and records a measured content queue; it does not
publish new claims, asset data or a visual design.

## Safe base

Clean attached worktree, HEAD/origin/Production `9062858`, Production deployment
7019869968 success. Main checkout remains untouched because it contains unrelated
local history and drafts. Latest deployment completed during the audit.

## Required behaviour

- Catalogue JSON-LD lists every visible card in its actual order, including
  legacy rows displayed after the unified catalogue. Hidden rows stay absent.
- The displayed result count includes these visible legacy rows.
- Legacy rows lack the unified facet contract. Show them only with no facets or
  with the single `find` facet, never under additional commodity/region/stage/
  infrastructure filters. Sorting/view changes alone do not hide them.
- Canonical and hreflang remain the existing clean catalogue URLs. Structured
  data describes the visible filtered results; do not invent hidden full lists.
- Existing designs 18/19, translations and catalogue data stay unchanged.
- Adjacent prospecting plots can share all description fields. Prefix their
  existing public code to metadata/Place descriptions to identify the actual
  plot, without inventing claims or changing the approved description text.
- In the foreign-investor, exploration-licence and rights-transfer guides, the
  existing paragraph about our selected finds links to `leads?kind=find` in all
  four languages. General catalogue links keep their original destination.
  Approved prose and editorial dates are not changed.

## Supporting work

Audit all 204 sitemap URLs for HTTP, canonical, hreflang, language, H1, metadata
and parseable JSON-LD. Map observed GSC and AnswerThePublic queries to current
pages, keeping unmeasured language variants explicitly hypothetical. Record the
gold hub/catalogue mismatch and stale guide copy as a separate owner-review
package, not an automatically published design/copy change.

Latest CI has seven Prettier-only failures. Format precisely those files;
preserve their public text and design. No functional offer/design change.

## Acceptance

Red/green tests exercise visible and filtered-out legacy rows, count and list
order on four languages and both views. Targeted/full Jest baseline, ESLint,
build, 375/1440 light/dark browser checks, strong independent review, then normal
GitHub/Vercel deployment and live catalogue verification. No new paid service.
