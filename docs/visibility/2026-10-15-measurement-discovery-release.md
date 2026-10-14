# Measurement and AI discovery readiness — 15 October 2026

## Fixed

The shared public-path allowlist omitted the published prospecting index/plot
pages and offer details. Consequently first-landing attribution, consent settings
and GA4/Metrica provider measurement did not work on those paths. They now accept
the existing route contracts (`QN-P` plus exactly two digits, `QN-A` plus at least
two digits). The redirected offers index and nested/private lookalikes remain out.

No public copy, design, plot data, analytics IDs, consent choices or advertising
permissions changed. The automatic banner remains absent. A new blocking CI step
runs the seven analytics/consent suites, independent of legacy nonblocking tests.
The newly inherited QN-A03 copy document had a Prettier failure; only blank lines
and table alignment were formatted. Its approved wording/numbers are unchanged,
verified by normalized content comparison.

## Verification

- TDD regression failures reproduced before each route fix, then green. Coverage
  checks all current static/content-backed sitemap route families and four locales.
- Seven measurement suites / 41 tests pass, including same-page contact events,
  first-landing retention, denied consent and referrer/query sanitization.
- Full Jest: 3331 pass, 27 failures in the five existing marketplace suites,
  two skipped; CSRF timing passed. This is not an entirely green full suite.
- Targeted lint, production build, formatting and diff checks pass. Independent
  strong review Ready after restoring inherited `document.referrer` in a fixture.
- Local production UI: four locales × two card families × 375/1440 × both themes,
  32 checks without overflow/broken images. Existing settings open on every card,
  analytics remains optional and advertising disabled. Localhost provider scripts
  remain blocked by the unchanged production-host guard; this alone is not live
  provider delivery evidence.
- Live pre-release sitemap: all 208 URLs return 200, one H1, canonical matching the
  URL, title and no noindex restriction. Twelve simulated Claude-SearchBot,
  Claude-User and Baiduspider requests pass robots/HTTP checks. These are not actual
  verified crawler-IP requests or crawler logs.

## Discovery and readiness

Real consumer-Claude tests distinguish two different outcomes: the unbranded
question did not select QAZNEDR among its sources; a subsequent explicit URL test
read and cited the published artisanal-mining guide. Neither establishes stable
recommendations for arbitrary users. DeepSeek and Kimi required sign-in/new
agreements, so no answer from those products was verified. Public search visibility
of RU/ZH pages is not a Chinese-AI citation or Baidu index confirmation.

Anthropic documents separate training, search and user-directed crawlers:
[official crawler guidance](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler).
The current robots policy allows their public-page access; no blanket new bot
rules or promises were added.

Fresh Vercel, GA4, Search Console, Bing AI and Metrica checks are recorded only in
`Documents/qaznedr-private/seo/2026-10-15/` (outside public Git). The Google dataset
still ends before this release. Named AI referrals were not visible in the complete
Vercel table; missing referrers cannot be attributed. Google AI appearances and
the Bing citation report measure different products. Metrica's dashboard shows a
vendor maintenance page, so audience aggregation could not be verified there.

The consent-selected GA4 sample is too limited to describe as a ready remarketing
audience. Actual advertising account links, approved advertising consent/public
wording, audience eligibility and spend approval remain prerequisites. Do not
silently reinstate an automatic consent banner, enable marketing signals or use
the aggregate visitor count as a customer list. No ads/spend, new agreements,
customer uploads or mail monitoring were performed. Map/licence drafts retain
their existing approval status.

## Release

Based on the verified live QN-A03 commit `5d05c95`; exact final CI/Production and
changed live consent behavior are recorded in the private closing checkpoint
after push. The old dirty main checkout was not reset or pushed.
