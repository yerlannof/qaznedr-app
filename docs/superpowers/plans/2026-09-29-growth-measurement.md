# Growth measurement plan — 29.09.2026

1. Confirm local/origin/Production match (04af16c, verified at start).
2. Read live GSC query/page/AI reports and record actual period; reconcile with existing Yandex evidence.
3. TDD admin attribution display in `src/app/[locale]/admin/inquiries/page.tsx` and mirrored test. Existing admin API tests cover authorization. No API/schema changes.
4. Update query map and write an actionable internal campaign kit with candidate phrases, existing landing pages, naming convention, exclusions and release gates.
5. Run focused/full Jest, ESLint/build, responsive browser check; independently review all changes.
6. Update roadmap, commit explicit paths, push master; verify CI, Production SHA/status and public/admin access behavior.
