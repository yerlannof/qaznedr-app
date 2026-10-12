# Plan — catalogue discovery, 12.10.2026

1. Confirm clean worktree and latest Production/base SHA. Preserve main drafts.
2. Reproduce catalogue list/count/facet defects in
   `src/__tests__/app/locale/leads/page.test.tsx` before changing behaviour.
3. Repair `src/app/[locale]/leads/page.tsx`: one visible row set for count/schema;
   legacy rows appear only without additional facets. Reuse all existing UI.
   Add plot-code disambiguation to `src/lib/prospecting/present.ts`, first proving
   the duplicate-description regression in its matching tests.
   Repair the contextual find links in the three guides × four locales, with
   a new regression suite at `src/__tests__/lib/insights/catalogue-links.test.ts`.
   Format the seven existing CI failures without copy/design/behaviour changes.
4. Collect full sitemap crawl and demand-to-page CSV under `docs/visibility/`.
   No inferred volume and no mass keyword/public page generation.
5. Prepare exact catalogue-aware guide copy and gold-hub scope for owner review.
6. Run targeted Jest, full Jest against legacy baseline, ESLint, build, browser
   checks, independent strong review. Fix required findings.
7. Commit explicit paths, push against unchanged origin/master, await Vercel
   success, check live results and submit changed canonical URLs to IndexNow.
8. Record evidence and remaining copy/design approval in HOLDING_ROADMAP.
