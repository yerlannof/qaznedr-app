# Web Vitals correctness plan

1. Add failing tracker and monitoring-service behavior tests in src/__tests__.
2. Correct INP mapping, value handling, ratings, duplicate suppression and effect cleanup in the two existing implementation files.
3. Run focused tests and review the exact diff; compare full Jest with the five known legacy failures, lint and production build.
4. Smoke the four locales in both themes at 375/1440; inspect current public sitemap and HTML independently.
5. Obtain independent review, update the roadmap and release record, commit explicit paths, push master and verify CI/Production for the exact SHA.

Files: src/components/monitoring/WebVitalsTracker.tsx; src/lib/middleware/performance-monitoring.ts; mirrored tests under src/__tests__/components/monitoring/ and src/__tests__/lib/middleware/; these documents and the release checkpoint.

Existing local outreach/mail logs remain outside this technical commit.
