# Measurement and AI discovery readiness — 15 October 2026

Owner requests completion of available work before remarketing and a fresh check
of traffic growth and discovery by Claude and Chinese AI search services.

## Scope

- Repair the public analytics allowlist for the published multilingual
  `/prospecting` index, `QN-Pnn` details and `/offers/QN-Ann` detail pages. Preserve consent, public-host,
  referrer sanitization, private-route exclusions and default-disabled advertising.
- Verify first landing attribution and provider page/contact delivery on those
  pages without sending real inquiries or collecting contact information.
- Inspect live search/traffic dashboards when authenticated access is available.
  Keep raw queries, counts and screenshots outside the public repository.
- Check official crawler guidance and public/available AI search surfaces.
  Report crawlability, search retrieval, citations, referral visits and inquiries
  separately. A simulated crawler UA is not evidence of a real crawler visit.

## Boundaries

No new public wording/design, article publication, company/plot data edits,
advertising consent expansion, audience uploads, paid activation or agreements.
The prepared map/licence drafts still require their existing specific approval.
No automatic mail monitoring. Existing source/session metrics are not retroactive
remarketing audiences and missing referrers must not be classified as AI visits.

## Acceptance

Regression tests fail on the omitted prospecting routes before the fix, then
pass for all four locales, exact plot route grammar, first landing retention,
consent gating and provider contact events. Other private paths remain excluded.
Full baseline comparison, lint, build, responsive checks and independent review
precede deployment. Verify the exact production commit after push.
