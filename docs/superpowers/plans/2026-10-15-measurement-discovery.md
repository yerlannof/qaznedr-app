# Measurement and discovery readiness plan — 15 October 2026

1. Synchronize the clean attached worktree with the already deployed QN-A03
   release; preserve the unrelated dirty main checkout.
2. Add failing regression tests in analytics attribution/provider tests; include
   public prospecting and offer routes and rejected private/lookalike routes.
3. Extend `src/lib/analytics/attribution.ts` narrowly. Run targeted tests and lint.
4. Read live search dashboards and verify crawler/search visibility. Store all
   telemetry and screenshots under `Documents/qaznedr-private/seo/2026-10-15/`.
5. Run full Jest baseline comparison, build and browser checks (four languages,
   375/1440, both themes where applicable). Independent strong review of the
   complete session diff; resolve findings through regression tests.
6. Record the concrete release and discovery limitations in visibility notes and
   HOLDING_ROADMAP. Commit explicit paths, push master, verify CI and exact
   Production success and repeat the changed live behavior check.

Code paths: `src/lib/analytics/attribution.ts`,
`src/__tests__/lib/analytics/attribution.test.ts`,
`src/__tests__/lib/analytics/providers.test.ts`. Add these analytics suites to
the existing blocking CI check if their execution is not otherwise guaranteed.
Do not add marketing settings or claim an active audience without verification.
