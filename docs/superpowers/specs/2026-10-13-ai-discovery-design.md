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
