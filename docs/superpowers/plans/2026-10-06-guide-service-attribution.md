# Implementation plan — 2026-10-06

1. Add failing regressions for guide service hop, service contact surfaces/mobile/language switch and canonical invariance.
2. Extend existing guide helper and markdown renderer; propagate validated query through the three existing services pages and components. Do not add another contact flow or infer unapproved service topics.
3. Targeted tests, lint, full Jest and build. Compare failures against current baseline, not only the old September baseline.
4. Run local production server on3107; browser all languages/themes/mobile/desktop, verify links without sending messages/forms. Stop own server.
5. Independent full-diff review, repair material findings with regression tests.
6. Document result in release report and roadmap; commit only explicit changed paths. Push HEAD:master from clean worktree only after fetched origin is still parent; wait exact SHA production success and verify live paths.

Source scope: src/lib/insights/{contact-context,content}.ts; src/components/features/HoldingServices.tsx; src/app/[locale]/services/{page,geological/page,legal/page}.tsx; src/components/layouts/{Navigation,Footer,MobileTabBar}.tsx; src/app/[locale]/layout.tsx. Tests mirror these concerns under src/__tests__/. No content markdown/copy/design edits.
