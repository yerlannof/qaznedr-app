# Sources, AnswerThePublic and discovery — 13.10.2026

## What changed

- Article JSON-LD now includes `citation` from the already visible Sources section
  in 12 guides × 4 locales. No body links, images, code examples, own-site URLs,
  credentials or invalid/non-web URLs become citations. Source order is kept;
  an empty list omits the field. Public wording and editorial/law dates are unchanged.
- The legacy discovery manifest's logo returned 404. It now points to the existing
  approved `/brand/apple-touch-icon.png`. This manifest is not a requirement for
  modern ChatGPT Search and does not establish recommendations.
- The llms catalogue enumeration includes its already published third offer kind,
  `artisanal mining plots`. No invented API endpoints or new public claims.

## Evidence and limits

- TDD: source extractor/page wiring red54 → green80; discovery contract red2 →
  green8. Independent review identified trailing-dot hostnames; focused red1 →
  green23 fixes own-domain/localhost comparisons without modifying emitted external URLs.
- Combined initial targeted run: 88 pass. Final full run: 3315 pass, 27 failures in
  the same five legacy marketplace suites, 2 skipped. CSRF timing test passed this
  run; previous baseline included that intermittent failure. No new failing suite.
- Targeted ESLint, Prettier, build and diff checks pass. Existing build warnings
  from Prisma/OpenTelemetry remain unrelated to this change.
- Built HTTP pages: 48/48 source/citation parity, canonical, H1, no snippet/index
  restriction. Brand asset200. Four locales × two widths375/1440 × two themes:
  16/16, no overflow or broken images. Proofs in this date's proof directory.
- Independent review: Ready after the hostname fix. Parent inspected final diff.
- A simulated OAI-SearchBot User-Agent receives readable HTML200; public routes
  are allowed by robots, private routes remain disallowed. This does not test the
  real crawler's IP, prove indexing, or establish a ChatGPT recommendation.

## Why this is useful

Sources stay visible to readers and are also represented in the article graph.
This repairs a real discovery defect and makes evidence consistent, not a promise
of rankings. Google's official AI-feature guidance says ordinary SEO still applies
and no special AI file/schema is required:
[Google Search](https://developers.google.com/search/docs/appearance/ai-features).
Bing similarly connects crawl/index quality with eligibility for grounding:
[Bing guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a).
OpenAI distinguishes search access (`OAI-SearchBot`) from training (`GPTBot`):
[crawler documentation](https://developers.openai.com/api/docs/bots).

## Research and next work

See `2026-10-13-question-coverage.md` for 12 useful observed GSC intents. Six are
fully covered, four partially, two not covered (one financial intent is excluded
from geological promotion). Existing links are preserved; do not add duplicates.
Ready drafts on reading maps and exploration/extraction/artisanal licence types
still need explicit owner approval before translation/publication. The current
AnswerThePublic approval is for free account creation, not those public texts.

AnswerThePublic registration/research evidence is recorded separately in
`2026-10-13-answerthepublic-account.md`; raw private GSC export stays outside Git
and was not uploaded to the service. Mail automation remains paused.

## Release

Working base: clean attached worktree HEAD/origin `5237f56`, previous exact Vercel
Production Ready confirmed. Main checkout remains old and dirty and was not reset.
Code release `1eb4aaab7a86e435cfc7b39e390348fca7bf43a7` is live. Vercel Production
`HTNTzhMaefpuM9NEhGCxJ7m5FCsf` Ready/exact commit confirmed in the authorised UI
and GitHub commit status. Live48/48, logo200, readable SearchBot-UA request200;
IndexNow200 accepted48 changed canonical guides (not indexing proof).

Initial CI38370647227 flagged only missing final newlines in the two proof JSON
files. Both were formatted; the complete repository `npm run format:check` now
passes. The closing checkpoint contains only documentation/evidence/format fixes,
not new application behaviour; its CI and exact production synchronisation are
verified after push and retained in private `qaznedr-private/seo/2026-10-13-atp/final-release.json`.

### CI loader follow-up

`5a93474`/CI38371403413 completed successfully overall, but inspection of its test
log showed **no full tests actually ran**: the clean install lacked `ts-node` for
the TypeScript Jest config. Historical `continue-on-error` hid that setup error.
Local Node26 uses native TypeScript. This does not invalidate the executed local tests; it also cannot be described as
successful CI test coverage. A pinned development dependency `ts-node@10.9.2`
repairs the missing loader. Explicit CommonJS/node compiler options for this config
avoid the application's bundler resolution (`TS5095`); a blocking four-suite SEO check now precedes the legacy
nonblocking full-suite step. Exact focused command passes88 locally. Final CI logs
must explicitly show the focused tests running and passing before task closure.
No application wording/design/schema behaviour changes in this follow-up.
