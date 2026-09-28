# Quiet analytics and mineral metadata — 29 September 2026

## Change

The owner explicitly requested removal of the distracting analytics acceptance block. Automatic banner is removed; existing footer settings, valid choices, default-denied providers, consent expiration and cross-tab revocation remain. Existing aggregate Vercel statistics and search-console metrics are unchanged. GA4/Metrica will cover consenting visitors, not all visitors. Advertising and Webvisor remain disabled.

Six existing mineral hubs had duplicate descriptions. Each now prefixes the approved description with its existing localized mineral name; CollectionPage schema matches. No new keyword pages, public claims or visual content.

## Verification before push

- Consent regression red: first visit and expiry still showed banner; fixed green. Tests cover four locales/navigation, opt-in/withdrawal, focus restoration and expiration.
- Mineral regression red: descriptions lacked mineral name/uniqueness. Green: six hubs × four locales, schema matches meta; 35 focused tests.
- Independent review Ready, 45 focused tests passed.
- Full Jest: 1700 passed; 28 known failures in legacy marketplace suites plus CSRF timing. No new failing suite. /tmp/qaznedr-quiet-full-jest.log.
- ESLint changed files clean; build successful, /tmp/qaznedr-quiet-build.log.
- Fresh local origin3113: four locales ×375/1440×light/dark, no automatic banner/dialog/overflow, settings open only through footer, Escape closes. No GA4/Metrica scripts without consent. Existing local-host guard also applies; provider consent gating independently covered by unit tests.

## Release procedure and continuation

Push master, verify matching successful GitHub CI and Production deployment, inspect live homepage and descriptions/schema for all24 hub URLs, then send those changed URLs to IndexNow. Exact current release SHA/status is available in GitHub deployment history and the session completion report; do not treat accepted IndexNow submission as proof of indexing.

Next work follows real query and inquiry evidence in the existing visibility reports. New editorial pages still need concrete copy approval; no mass region/metal placeholder pages. User does not need to provide a map asset for service discovery to continue.
