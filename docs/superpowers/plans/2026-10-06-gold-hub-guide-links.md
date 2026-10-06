# Gold hub guide links implementation plan

1. Add regression cases to src/__tests__/app/locale/minerals/page.test.tsx; observe intended red failures.
2. Change only the existing guide-link row in src/app/[locale]/minerals/[mineral]/page.tsx: three approved gold guides ahead of the retained reserve/FAQ links; no other hub changes.
3. Lead review, targeted/full tests, lint/typecheck/format/build. Compare failures with the current baseline (five legacy suites, possible CSRF timing).
4. Local375/1440 RU/KZ/EN/ZH, two themes; link navigation to a real guide without form sending. Independent full diff review; fix material findings.
5. Release report and roadmap. Explicit paths commit, origin-parent check, push HEAD:master. Verify exact CI/Production and four live gold pages; notify IndexNow with clean gold URLs. Preserve original dirty documents and record worktree handoff.
