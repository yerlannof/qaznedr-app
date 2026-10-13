# Sources and question-led discovery — 13.10.2026

Owner asks for stronger SEO using AnswerThePublic and for discovery in AI answers.
This package connects existing visible evidence with machine-readable articles,
repairs a broken discovery logo, and prepares a question-to-content queue.
It does not promise model recommendations or invent content/credentials.

## Basis and authorisation

Clean attached worktree HEAD/origin `5237f56`; exact Vercel Production Ready was
verified at previous close. Main checkout remains old and dirty; do not reset it.
New public prose/design still needs owner approval. Reusing already approved
source URLs and brand assets in schema is technical wiring, not new public claims.

## Behaviour

- Each guide's Article JSON-LD cites only external HTTP(S) links in its existing
  Sources section: `Источники`, `Sources`, `Дереккөздер`, `参考资料`.
- Use Markdown tokens; links in images, code examples and unrelated sections do
  not become citations. Source sections end at the next heading of equal or
  higher level; nested lists/source subsections are supported.
- Deduplicate URLs while preserving order, fragments and query semantics. Reject
  malformed URLs, non-web schemes, credentials and links to our own site.
- Do not claim these are newly reviewed sources or alter text/editorial/law dates.
  Omit `citation` when there are no valid source links.
- Repair the 404 discovery logo URL with an already approved existing brand file.
- The llms catalogue-type enumeration may reuse the existing approved phrase
  `Artisanal mining plots`, already present in that same file. Do not rewrite
  plugin descriptions or advertise API endpoints that do not exist.

## AnswerThePublic

Existing anonymous daily search is consumed. Registration modal accepts terms;
owner confirmation received and FREE Google-account registration completed. No password,
trial, billing, site-publishing connection or automatic publishing is authorised.
Research completed within the three permitted daily searches; account/project is free.
Query seed prepared: «геологическая карта», Russian, Kazakhstan. Subsequent
research should compare maps/licences/core topics with the private 145-row GSC
export, not treat generated AI prompts as measured private conversations.

## Acceptance

TDD extractor and Article wiring, full published 12 × 4 article/source parity,
targeted/full Jest baseline, ESLint/format/build, responsive browser checks and
independent strong review. Public HTML must remain readable without JavaScript;
HTTP/robots tests are access checks, not evidence of indexing or citations.
Normal GitHub/Vercel deploy, live source-parity and brand-asset checks, one IndexNow
submission for changed canonical guides. Save no raw private analytics in Git.

## Validation follow-up discovered during release

CI38371403413 reports success overall, but its historical nonblocking full test
step could not load `jest.config.ts` because the clean dependency install lacks
`ts-node`. Local Node26 tests ran; that is not evidence the Node20 CI ran tests.
Add the official loader as a pinned development dependency10.9.2 and a blocking,
focused four-suite SEO test step before the existing nonblocking legacy full run.
Use explicit CommonJS/node compiler options for the Jest loader in `jest.config.ts`:
the application uses bundler resolution, which is incompatible with CommonJS
(`TS5095`), and the local native TypeScript runtime bypasses this loader path.
Preserve the known marketplace test boundary. No site behaviour/public copy change.
Use a package-lock-only install to preserve shared local node_modules; verify
the minimal lock diff, focused tests, formatting, independent review and clean CI.
