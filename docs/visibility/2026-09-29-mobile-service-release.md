# Mobile scene and geological service release — 29 September 2026

Owner approved review12 and exact map service copy with “да давай дальше”. Previous deployment50d75b6 was successful and synchronized before work.

## Delivered

- Native scroll layer motion at phone and desktop sizes; all explanations stay in normal document flow. No wheel/touch interception. Short screens <=640px, reduced motion and initial/no-JS rendering use an expanded static illustration.
- Approved contour motif, service text and map-guide CTA in RU/KZ/EN/ZH. Maps attract a consultation; no map asset or area data was invented/published.
- Service title/description refreshed through existing metadata helper. Canonical, hreflang and service schema preserved. Chinese OG subset refreshed; unsupported Kazakh codepoints are covered by the existing non-CJK font fallback.
- WhatsApp configured for RU/KZ/EN carries geology topic and existing analytics event. Chinese and unconfigured channels use localized contact?service=geology. No new analytics provider or data collection.

## Evidence

- TDD: scene5 tests and support8 tests, including red→green ZH WhatsApp-only fallback. Existing map-guide/service tests pass.
- Final full Jest:1668 pass,28 pre-existing failures in known marketplace suites plus intermittent CSRF timing; no new failing suite. Logs: /tmp/qaznedr-mobile-jest-final.log.
- ESLint changed files clean; npm run build successful (/tmp/qaznedr-mobile-build-final.log).
- Browser375×812/1440×1000, four locales, light/dark: scene and service copy visible, no horizontal overflow. Mobile natural scroll changed drop0.239→0.770 and focus0→0.763; desktop and mobile layer screenshots inspected.
- Tablet820×900 had41px right gutter and no overflow.844×390 switched to static; three steps present. Reduced-motion and cleanup covered by tests and CSS review; no physical iPhone claim.
- Map-guide CTA reached /ru/contact?service=geology, rendered selected geology context; no test lead sent. Local build lacks production channels, so direct WhatsApp/WeChat paths are unit-tested and will be inspected on production.
- Independent strong reviewer: Ready after correcting Chinese fallback. No remaining blocking finding.

## Publication

Pending push, CI/Production verification and IndexNow submission; record exact release below after completion.
