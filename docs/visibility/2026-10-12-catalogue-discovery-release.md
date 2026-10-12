# Catalogue discovery and SEO demand — 12.10.2026

## Measured basis

Authorised Google Search Console, property `https://qaznedr.kz/`, Web,
three-month selector; actual available dates **25.09–10.10.2026**. Exported the
full report, not only the first ten displayed queries. Chart: 246 clicks,
3,161 impressions, CTR 7.8%, average position 6.5. Two complete seven-day
windows: 27.09–03.10 **80 clicks / 1,099 impressions**; 04.10–10.10
**158 / 2,037**: +97.5% clicks and +85.4% impressions.

These are search metrics, not unique visitors, qualified enquiries or a causal
effect of this release. Today's added plots cannot explain the preceding week.
No fresh Vercel/WhatsApp enquiry comparison was made in this package.

The export includes 145 query rows and 86 page rows. Query rows total only
79 clicks / 1,082 impressions; they are not the complete chart and should not be
used to estimate a full brand/non-brand split. Query and page tables are separate
aggregates: proposed query-to-page assignments are editorial recommendations,
not an observed join of the two exports.

Full exports and the first-pass 145-row demand map remain **outside the public
repository** at `/Users/yerlankulumgariyev/Documents/qaznedr-private/seo/2026-10-12-gsc/`.
`demand-map.csv` preserves source, period, clicks, impressions, position, proposed
cluster/locale/page and next action. 53 ambiguous rows stay unclassified; no page
is automatically generated for dialogue fragments or unclear queries. GSC
impressions are not market search volume.

## Content priorities

1. Existing artisanal-mining guide: strongest non-home page in the page export.
   Keep the guide → published plot → code-specific contact route. Catalogue hub
   integration is the next approved-design review, not a new licence promise.
2. Gold maps and satellite limitations: continue improving the existing evidence
   and contact path. Do not create several thin URLs for word-order variations.
3. Education in Kazakh and English: real impressions include «геология деген не»
   and `what is geology`. Review the existing introduction and snippet before
   creating another definition article; small samples do not establish a cause
   for zero clicks.
4. Core logging/results interpretation: real English demand, weaker positions.
   A useful new worked example needs permitted evidence, not invented drilling
   results or investment advice.
5. Licensing distinctions: requests about gold extraction must not be silently
   answered as artisanal mining. Prepare a verified exploration/extraction/
   artisanal comparison and obtain owner approval before publishing.

AnswerThePublic remains a supplementary idea source. Its AI prompts do not
measure private LLM conversations, and its Google volume is not Baidu or Douyin
volume. The free Russian/Kazakhstan pilot was already consumed; no paid trial,
subscription or new API key was created. Kazakh variants need independent
research. Sources: [data collection](https://answerthepublic.zendesk.com/hc/en-us/articles/7299190956827-How-AnswerThePublic-Collects-Data),
[AI report](https://answerthepublic.zendesk.com/hc/en-us/articles/46695217018651-AI-Models-Report-in-AnswerThePublic).

## Live crawl before changes

Production `9062858`, deployment 7019869968 success. All **204 sitemap URLs**:
HTTP 200 without redirects, self canonical, one H1, correct HTML language and
five alternates (four locales + x-default), non-empty title/description, no
noindex, OG image present. All found JSON-LD blocks are parseable; the four
`legal/terms` pages have no JSON-LD. No duplicate titles or orphan URLs
in the internal-link graph. These checks do not prove indexing or mainland China
accessibility, and JSON parseability is not full schema validation.

Found repeated descriptions across neighbouring plot pages sharing a district
and licence term, plus four existing home/about pairs. Plot descriptions are
disambiguated with their already-public code in this release; the separate
about-page copy remains an owner decision.

## Changes

- Catalogue visible legacy cards join the displayed count and structured list in
  actual order. They appear only with no facets or sole `find`; other facets hide
  unfilterable legacy rows. The `find` tab remains available for legacy-only finds.
- All 18 published plot descriptions identify the plot code on RU/KZ/EN/ZH,
  preserving the approved description and real data.
- Twelve contextual links in three licensing/investor guides now target
  `leads?kind=find`. General catalogue links, words and editorial dates stay intact.
- Seven pre-existing formatting failures are fixed with Prettier only.

Google's [structured-data policy](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
requires representative visible content. We keep filtered JSON-LD tied to what
the visitor sees; the clean catalogue canonical is retained. No Product/Offer
claim, keyword stuffing, artificial reviews or LLM recommendation promise.

## Validation and release

Targeted Jest **122 pass**, full Jest **3,257 pass / 28 failures** in the five
known legacy suites plus the known CSRF timing test, 2 skipped. ESLint and build
pass. Full repository format check passes after the seven formatting repairs.
No new failing suite. Red/green logs are in `/tmp/qaznedr-oct12-*`,
`/tmp/qaznedr-catalogue-*` and `/tmp/catalogue-links-*`.

Browser: 16 catalogue combinations (four languages × 375/1440 × light/dark)
plus 64 combinations for the plot and three changed guides; one H1, no overflow
or broken loaded images. Four plot descriptions and twelve contextual links
were also read directly from rendered DOM. Proof: `proofs/2026-10-12-catalogue-discovery/browser.json`.
Legacy-only cases use unit fixtures; live data currently has two showcase finds,
18 prospecting plots and two assets. No production fixture/data writes.

Independent strong review found no code blocker; its single P2 report wording
was corrected to distinguish parseable JSON-LD from pages without schema. The
review verified all seven formatted files byte-for-byte against Prettier of
their base versions. Final deployment verification follows below.

## Remaining review

The gold mineral hub still intentionally uses the earlier finds-only layout.
It omits gold prospecting plots and sale assets that the unified gold catalogue
contains. Correcting that scope requires showing the catalogue-aware page and
checking its prose with the owner; do not append unrelated asset/plot cards under
the current claim that all cards are our geologists' findings. The ready
`docs/content-drafts/2026-10-01-read-geological-map.md` is still unpublished pending
explicit approval. No Chinese account or ad audience was activated here.
