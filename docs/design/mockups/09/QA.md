# Verification — 27.09.2026

## Fixed production scene 08 (4fa2418)

- TDD: three red regressions before implementation; 13 focused tests green.
- Full Jest: 1536 passed, 28 known failures (five legacy suites and intermittent CSRF timing); no new failures. Lint/build passed.
- Local browser: 27 cases, then same 27 on https://qaznedr.kz; four locales, both themes, 1440×900, 1024×740, 375×900 plus no-JS/reduced/short desktop. Direct coordinates, reverse path, stable copy and stationary pose checked.
- Real wheel input tested locally and on production: small/large deltas, reverse direction, pause. Passed.
- Independent Sol review, including its own Chrome measurements: no blockers.
- Production deployment 6683994649: success, SHA matches local/origin at release.
- Synthetic local headless Chrome benchmark: 240 frames at CPU 1× and 4×. Median 16.7 ms / p95 16.8 ms in both; zero long tasks. Frames over 34 ms: 2 and 0 respectively. This is a controlled benchmark, not a guarantee for every visitor's device.

Detailed temporary evidence: `/tmp/qaznedr-scroll-browser/`, `/tmp/qaznedr-scroll-*.log`.

## Unapproved visual proposal 09

- Parent independently ran 26 cases: four locales × both themes × 375×900 / 1024×740 / 1440×900, plus reduced motion and JavaScript disabled. Summary: `qa-preview.json`.
- Verified continuous motion within a stage, reverse coordinates, stable copy, one accessible active heading, keyboard-accessible stage buttons, no page errors or horizontal overflow.
- Prototype agent also checked manual resizing, asset decoding and locale/theme switching; independent reviewer repeated 1024×740 on all four locales.
- Parent visually inspected compact, exploded, focus and mobile screenshots; corrected front-edge assembly, caption overlap and label contrast before presentation.
- Reviewer findings corrected: accessible desktop controls, localized scene controls, exact reset offset. Reset was reproduced red (story top ≈0 instead of64), then green after using sticky offset.
- `desktop-01.png`, `desktop-02.png`, `desktop-03.png`, `mobile-03.png` are actual browser captures. Image itself is an illustrative 2.5D engraving, not a physically exact 3D asset.
- Review toolbar labels stay Russian for the owner. Product scene copy matches the approved four-language translations.
- No application changes or added dependencies in this proposal. Owner requested further visual refinement; proposal not approved.

Temporary parent scripts/evidence: `/tmp/qaznedr-09-parent/`.
